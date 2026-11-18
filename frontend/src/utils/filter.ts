import type { Dish, Filters, Recommendation, Restaurant } from '../types'
import { buildCtx, dietAllows, scoreDish, scoreRestaurant, textMatches, type Catalog, type UserSignals } from './recommend'

export const defaultFilters: Filters = { cuisineIds: [], diet: 'any', priceLevels: [], minRating: 0, flavours: [], sort: 'match' }

export const priceLevelOfDish = (price: number): 1 | 2 | 3 | 4 => (price <= 150 ? 1 : price <= 300 ? 2 : price <= 500 ? 3 : 4)

export function activeFilterCount(f: Filters): number {
  return f.cuisineIds.length + (f.diet !== 'any' ? 1 : 0) + f.priceLevels.length + (f.minRating > 0 ? 1 : 0) + f.flavours.length
}

export interface DiscoveryResult {
  restaurants: Recommendation<Restaurant>[]
  dishes: Recommendation<Dish>[]
}

/** Pure: query + filters → ranked restaurants and dishes. */
export function discover(cat: Catalog, sig: UserSignals, query: string, f: Filters, now: number): DiscoveryResult {
  const ctx = buildCtx(cat, sig, now)
  const cuisineName = new Map(cat.cuisines.map((c) => [c.id, c.name]))
  const menuOf = new Map<number, Dish[]>()
  for (const d of cat.dishes) menuOf.set(d.restaurantId, [...(menuOf.get(d.restaurantId) ?? []), d])
  const q = query.trim()

  const restaurants = cat.restaurants.filter((r) => {
    const menu = menuOf.get(r.id) ?? []
    if (q) {
      const hay = [r.name, r.area, r.description, ...r.cuisineIds.map((c) => cuisineName.get(c) ?? ''), ...menu.map((d) => d.name)].join(' ')
      if (!textMatches(q, hay)) return false
    }
    if (f.cuisineIds.length && !r.cuisineIds.some((c) => f.cuisineIds.includes(c))) return false
    if (f.diet !== 'any') {
      const n = menu.filter((d) => dietAllows(f.diet, d.diet)).length
      if (n < Math.min(3, menu.length) || n === 0) return false
    }
    if (f.priceLevels.length && !f.priceLevels.includes(r.priceLevel)) return false
    if (f.minRating && r.avgRating < f.minRating) return false
    if (f.flavours.length && !menu.some((d) => f.flavours.every((fl) => d.flavourTags.includes(fl)))) return false
    return true
  })

  const dishes = cat.dishes.filter((d) => {
    if (q) {
      const r = ctx.restaurantById.get(d.restaurantId)
      const hay = [d.name, d.description, d.category, cuisineName.get(d.cuisineId) ?? '', r?.name ?? ''].join(' ')
      if (!textMatches(q, hay)) return false
    }
    if (f.cuisineIds.length && !f.cuisineIds.includes(d.cuisineId)) return false
    if (!dietAllows(f.diet, d.diet)) return false
    if (f.priceLevels.length && !f.priceLevels.includes(priceLevelOfDish(d.price))) return false
    if (f.minRating && d.avgRating < f.minRating) return false
    if (f.flavours.length && !f.flavours.every((fl) => d.flavourTags.includes(fl))) return false
    return true
  })

  const rs = restaurants.map((r) => scoreRestaurant(ctx, r))
  const ds = dishes.map((d) => scoreDish(ctx, d))
  const sorter = <T extends { id: number }>(get: (x: T) => { rating: number; price: number }) =>
    (a: Recommendation<T>, b: Recommendation<T>) => {
      if (f.sort === 'rating') return get(b.item).rating - get(a.item).rating || b.score - a.score
      if (f.sort === 'price') return get(a.item).price - get(b.item).price || b.score - a.score
      return b.score - a.score || a.item.id - b.item.id
    }
  rs.sort(sorter<Restaurant>((r) => ({ rating: r.avgRating, price: r.costForTwo })))
  ds.sort(sorter<Dish>((d) => ({ rating: d.avgRating, price: d.price })))
  return { restaurants: rs, dishes: ds }
}

/** Which single filter, if removed, would bring back the most results — for the empty state's one-click relax. */
export function bestRelaxation(cat: Catalog, sig: UserSignals, query: string, f: Filters, now: number, tab: 'restaurants' | 'dishes') {
  const options: { label: string; next: Filters; q: string }[] = []
  if (query.trim()) options.push({ label: `Drop the search “${query.trim()}”`, next: f, q: '' })
  if (f.cuisineIds.length) options.push({ label: 'Any cuisine', next: { ...f, cuisineIds: [] }, q: query })
  if (f.diet !== 'any') options.push({ label: 'Any diet', next: { ...f, diet: 'any' }, q: query })
  if (f.priceLevels.length) options.push({ label: 'Any price', next: { ...f, priceLevels: [] }, q: query })
  if (f.minRating) options.push({ label: 'Any rating', next: { ...f, minRating: 0 }, q: query })
  if (f.flavours.length) options.push({ label: 'Any flavour', next: { ...f, flavours: [] }, q: query })
  let best: { label: string; next: Filters; q: string; count: number } | null = null
  for (const o of options) {
    const res = discover(cat, sig, o.q, o.next, now)
    const count = tab === 'restaurants' ? res.restaurants.length : res.dishes.length
    if (count > 0 && (!best || count > best.count)) best = { ...o, count }
  }
  return best
}
