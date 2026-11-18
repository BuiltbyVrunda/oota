import { q } from '../../db/pg.ts'
import { getCatalog } from '../../services/catalog.ts'
import { emptyPrefs, getSignals } from '../../services/signals.ts'
import { buildCtx, scoreDish, scoreRestaurant, type UserSignals } from '../../shared/recommend.ts'
import type { Dish, Recommendation, Restaurant } from '../../shared/types.ts'
import { DIETS_FOR_FILTER, prefixTsQuery, type DiscoverQuery } from './schema.ts'

/** Builds a parameterised WHERE clause: values go into $n placeholders, never into the SQL text. */
class Where {
  parts: string[] = []
  params: unknown[] = []
  add(sql: (p: (v: unknown) => string) => string) {
    this.parts.push(sql((v) => {
      this.params.push(v)
      return '$' + this.params.length
    }))
  }
  get sql() {
    return this.parts.length ? 'WHERE ' + this.parts.join(' AND ') : ''
  }
}

/** SQL filters for the Restaurants tab. Returns the matching ids. */
export async function filterRestaurantIds(f: DiscoverQuery): Promise<number[]> {
  const w = new Where()
  if (f.q) {
    const ts = prefixTsQuery(f.q)
    w.add((p) => {
      const like = p('%' + f.q + '%')
      const fts = ts ? ` OR d.search_vector @@ to_tsquery('english', ${p(ts)})` : ''
      return `(r.name ILIKE ${like} OR r.area ILIKE ${like} OR r.description ILIKE ${like}
        OR EXISTS (SELECT 1 FROM restaurant_cuisines rc JOIN cuisines c ON c.cuisine_id = rc.cuisine_id
                    WHERE rc.restaurant_id = r.restaurant_id AND c.name ILIKE ${like})
        OR EXISTS (SELECT 1 FROM dishes d WHERE d.restaurant_id = r.restaurant_id AND (d.name ILIKE ${like}${fts})))`
    })
  }
  if (f.cuisine.length) {
    w.add((p) => `EXISTS (SELECT 1 FROM restaurant_cuisines rc WHERE rc.restaurant_id = r.restaurant_id AND rc.cuisine_id = ANY(${p(f.cuisine)}::int[]))`)
  }
  if (f.diet !== 'any') {
    const diets = DIETS_FOR_FILTER[f.diet]
    // a "veg" restaurant = at least 3 compatible dishes (or its whole menu if the menu is tiny)
    w.add((p) => {
      const d = p(diets)
      return `(SELECT COUNT(*) FILTER (WHERE d.diet = ANY(${d}::text[])) >= LEAST(3, COUNT(*))
                  AND COUNT(*) FILTER (WHERE d.diet = ANY(${d}::text[])) > 0
                 FROM dishes d WHERE d.restaurant_id = r.restaurant_id)`
    })
  }
  if (f.price.length) w.add((p) => `r.price_level = ANY(${p(f.price)}::smallint[])`)
  if (f.minRating) w.add((p) => `r.avg_rating >= ${p(f.minRating)}`)
  // flavour profile: some dish has ALL chosen flavours — array containment, served by the GIN index idx_dishes_flavour
  if (f.flavour.length) {
    w.add((p) => `EXISTS (SELECT 1 FROM dishes d WHERE d.restaurant_id = r.restaurant_id AND d.flavour_tags @> ${p(f.flavour)}::text[])`)
  }
  const rows = await q<{ id: number }>(`SELECT r.restaurant_id AS id FROM restaurants r ${w.sql}`, w.params)
  return rows.map((r) => r.id)
}

/** SQL filters for the Dishes tab — full-text search (websearch + prefix) with an ILIKE fallback. */
export async function filterDishIds(f: DiscoverQuery): Promise<{ id: number; rank: number }[]> {
  const w = new Where()
  w.add(() => 'd.is_available')
  let rank = '0'
  if (f.q) {
    const ts = prefixTsQuery(f.q)
    w.add((p) => {
      const like = p('%' + f.q + '%')
      const web = p(f.q)
      const pre = ts ? ` OR d.search_vector @@ to_tsquery('english', ${p(ts)})` : ''
      rank = `ts_rank(d.search_vector, websearch_to_tsquery('english', ${web}))`
      return `(d.search_vector @@ websearch_to_tsquery('english', ${web})${pre}
               OR d.name ILIKE ${like} OR c.name ILIKE ${like} OR r.name ILIKE ${like})`
    })
  }
  if (f.cuisine.length) w.add((p) => `d.cuisine_id = ANY(${p(f.cuisine)}::int[])`)
  if (f.diet !== 'any') w.add((p) => `d.diet = ANY(${p(DIETS_FOR_FILTER[f.diet])}::text[])`)
  if (f.price.length) {
    w.add((p) => `(CASE WHEN d.price <= 150 THEN 1 WHEN d.price <= 300 THEN 2 WHEN d.price <= 500 THEN 3 ELSE 4 END) = ANY(${p(f.price)}::int[])`)
  }
  if (f.minRating) w.add((p) => `d.avg_rating >= ${p(f.minRating)}`)
  if (f.flavour.length) w.add((p) => `d.flavour_tags @> ${p(f.flavour)}::text[]`)
  return q<{ id: number; rank: number }>(
    `SELECT d.dish_id AS id, ${rank}::float AS rank
       FROM dishes d
       JOIN restaurants r ON r.restaurant_id = d.restaurant_id
       JOIN cuisines c ON c.cuisine_id = d.cuisine_id
     ${w.sql}`,
    w.params,
  )
}

async function signalsOrEmpty(userId?: number): Promise<UserSignals> {
  return userId ? getSignals(userId) : { prefs: emptyPrefs, searches: [], reviews: [], views: [] }
}

export async function discoverRestaurants(f: DiscoverQuery, userId?: number): Promise<Recommendation<Restaurant>[]> {
  const [ids, catalog, sig] = await Promise.all([filterRestaurantIds(f), getCatalog(), signalsOrEmpty(userId)])
  const ctx = buildCtx(catalog, sig, Date.now())
  const set = new Set(ids)
  const recs = catalog.restaurants.filter((r) => set.has(r.id)).map((r) => scoreRestaurant(ctx, r))
  recs.sort((a, b) =>
    f.sort === 'rating' ? b.item.avgRating - a.item.avgRating || b.score - a.score
      : f.sort === 'price' ? a.item.costForTwo - b.item.costForTwo || b.score - a.score
        : b.score - a.score || a.item.id - b.item.id)
  return recs.slice(f.offset, f.offset + f.limit)
}

export async function discoverDishes(f: DiscoverQuery, userId?: number): Promise<Recommendation<Dish>[]> {
  const [hits, catalog, sig] = await Promise.all([filterDishIds(f), getCatalog(), signalsOrEmpty(userId)])
  const ctx = buildCtx(catalog, sig, Date.now())
  const rank = new Map(hits.map((h) => [h.id, h.rank]))
  const recs = catalog.dishes.filter((d) => rank.has(d.id)).map((d) => scoreDish(ctx, d))
  // best match = personal score, nudged by full-text relevance when searching
  const key = (r: Recommendation<Dish>) => r.score + (rank.get(r.item.id) ?? 0) * 0.5
  recs.sort((a, b) =>
    f.sort === 'rating' ? b.item.avgRating - a.item.avgRating || b.score - a.score
      : f.sort === 'price' ? a.item.price - b.item.price || b.score - a.score
        : key(b) - key(a) || a.item.id - b.item.id)
  return recs.slice(f.offset, f.offset + f.limit)
}
