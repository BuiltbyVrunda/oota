/**
 * npm run seed — loads db/seed/*.json (exported from the frontend mock data) into PostgreSQL and MongoDB,
 * then runs the review sync so cached ratings match. Idempotent: TRUNCATE … RESTART IDENTITY CASCADE first.
 * Phase-1 numeric ids are kept as the Postgres primary keys (deterministic mapping).
 */
import bcrypt from 'bcryptjs'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool, tx } from '../db/pg.ts'
import { col, mongo } from '../db/mongo.ts'
import { ensureMongoIndexes } from '../db/mongoIndexes.ts'
import { syncAll } from '../services/reviewSync.ts'
import type { Cuisine, Dish, Preferences, Restaurant, Review } from '../shared/types.ts'

const dir = resolve(dirname(fileURLToPath(import.meta.url)), '../../../db/seed')
const load = <T>(name: string): T => JSON.parse(readFileSync(`${dir}/${name}.json`, 'utf8')) as T

const meta = load<{ exportedAt: string; demoPassword: string }>('meta')
const shift = Date.now() - new Date(meta.exportedAt).getTime() // keep "2 days ago" meaning 2 days ago
const at = (iso: string) => new Date(new Date(iso).getTime() + shift)

const cuisines = load<Cuisine[]>('cuisines')
const users = load<{ id: number; fullName: string; email: string }[]>('users')
const restaurants = load<Restaurant[]>('restaurants')
const dishes = load<Dish[]>('dishes')
const reviews = load<Review[]>('reviews')
const prefs = load<(Preferences & { userId: number })[]>('preferences')
const searches = load<{ userId: number; query: string; filters: Record<string, unknown>; at: string; clickedRestaurantId?: number }[]>('searches')
const views = load<{ userId: number; restaurantId: number; at: string }[]>('views')
const favourites = load<{ userId: number; restaurantId: number }[]>('favourites')

const hash = await bcrypt.hash(meta.demoPassword, 10)
const setSeq = (table: string, colName: string) => `SELECT setval(pg_get_serial_sequence('${table}', '${colName}'), (SELECT COALESCE(MAX(${colName}), 1) FROM ${table}))`

console.log('PostgreSQL')
await tx(async (c) => {
  await c.query('TRUNCATE order_items, orders, favourite_restaurants, dishes, menu_categories, restaurant_cuisines, restaurants, cuisines, users RESTART IDENTITY CASCADE')

  for (const u of users) await c.query('INSERT INTO users (user_id, full_name, email, password_hash) VALUES ($1, $2, $3, $4)', [u.id, u.fullName, u.email, hash])
  await c.query(setSeq('users', 'user_id'))

  for (const x of cuisines) await c.query('INSERT INTO cuisines (cuisine_id, slug, name, image_url) VALUES ($1, $2, $3, $4)', [x.id, x.slug, x.name, x.imageUrl])
  await c.query(setSeq('cuisines', 'cuisine_id'))

  for (const r of restaurants) {
    await c.query(
      `INSERT INTO restaurants (restaurant_id, slug, name, description, address, area, price_level, cost_for_two, is_pure_veg,
                                opens_at, closes_at, cover_url, gallery_urls, trending_score)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [r.id, r.slug, r.name, r.description, r.address, r.area, r.priceLevel, r.costForTwo, r.isPureVeg, r.opensAt, r.closesAt, r.coverUrl, r.galleryUrls, r.trendingScore])
    for (const cid of r.cuisineIds) await c.query('INSERT INTO restaurant_cuisines (restaurant_id, cuisine_id) VALUES ($1, $2)', [r.id, cid])
  }
  await c.query(setSeq('restaurants', 'restaurant_id'))

  // menu categories in order of first appearance, then dishes
  const catId = new Map<string, number>()
  for (const r of restaurants) {
    const cats = [...new Set(dishes.filter((d) => d.restaurantId === r.id).map((d) => d.category))]
    for (const [i, name] of cats.entries()) {
      const { rows } = await c.query<{ id: number }>('INSERT INTO menu_categories (restaurant_id, name, sort_order) VALUES ($1, $2, $3) RETURNING category_id AS id', [r.id, name, i])
      catId.set(`${r.id}:${name}`, rows[0].id)
    }
  }
  for (const d of dishes) {
    await c.query(
      `INSERT INTO dishes (dish_id, restaurant_id, category_id, cuisine_id, name, description, price, diet, spice_level, flavour_tags, allergens, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [d.id, d.restaurantId, catId.get(`${d.restaurantId}:${d.category}`), d.cuisineId, d.name, d.description, d.price, d.diet, d.spiceLevel, d.flavourTags, d.allergens, d.imageUrl])
  }
  await c.query(setSeq('dishes', 'dish_id'))

  for (const f of favourites) await c.query('INSERT INTO favourite_restaurants (user_id, restaurant_id) VALUES ($1, $2)', [f.userId, f.restaurantId])

  // A few historical orders (deterministic) so v_popular_dishes and the order-total trigger have data.
  let s = 7
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 40; i++) {
    const userId = 1 + Math.floor(rand() * users.length)
    const r = restaurants[Math.floor(rand() * restaurants.length)]
    const menu = dishes.filter((d) => d.restaurantId === r.id)
    const { rows } = await c.query<{ id: number }>(
      "INSERT INTO orders (user_id, restaurant_id, status, placed_at) VALUES ($1, $2, 'DELIVERED', now() - ($3 || ' days')::interval) RETURNING order_id AS id",
      [userId, r.id, Math.floor(rand() * 20)])
    const picks = new Set<number>()
    for (let k = 0; k < 1 + Math.floor(rand() * 3); k++) picks.add(menu[Math.floor(rand() * menu.length)].id)
    for (const dishId of picks) {
      // unit_price is copied from dishes inside SQL; the trigger then keeps orders.total_amount in sync
      await c.query('INSERT INTO order_items (order_id, dish_id, quantity, unit_price) SELECT $1, dish_id, $3, price FROM dishes WHERE dish_id = $2',
        [rows[0].id, dishId, 1 + Math.floor(rand() * 3)])
    }
  }
})

for (const t of ['users', 'cuisines', 'restaurants', 'restaurant_cuisines', 'menu_categories', 'dishes', 'favourite_restaurants', 'orders', 'order_items']) {
  const { rows } = await pool.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM ${t}`)
  console.log(`  ${t.padEnd(22)} ${rows[0].n}`)
}

console.log('MongoDB')
await mongo.connect()
await ensureMongoIndexes()
await Promise.all([col.prefs().deleteMany({}), col.reviews().deleteMany({}), col.searches().deleteMany({}), col.views().deleteMany({})])
await col.prefs().insertMany(prefs.map(({ userId, onboarded, ...p }) => ({
  _id: userId, ...p, diet: p.diet, spiceLevel: p.spiceLevel, onboardedAt: onboarded ? new Date() : null, updatedAt: new Date(),
})))
await col.reviews().insertMany(reviews.map((r) => ({
  restaurantId: r.restaurantId, userId: r.userId, userName: r.userName, rating: r.rating, text: r.text, tags: r.tags,
  dishRatings: r.dishRatings, createdAt: at(r.createdAt), updatedAt: at(r.createdAt),
})))
await col.searches().insertMany(searches.map((x) => ({
  userId: x.userId, query: x.query, filters: x.filters, ...(x.clickedRestaurantId ? { clickedRestaurantId: x.clickedRestaurantId } : {}), createdAt: at(x.at),
})))
await col.views().insertMany(views.map((v) => ({ userId: v.userId, restaurantId: v.restaurantId, viewedAt: at(v.at) })))
for (const [name, c] of Object.entries({ user_preferences: col.prefs(), reviews: col.reviews(), search_history: col.searches(), restaurant_views: col.views() })) {
  console.log(`  ${name.padEnd(22)} ${await (c as { countDocuments: () => Promise<number> }).countDocuments()}`)
}

console.log('Review sync (Mongo aggregate → Postgres cache)')
console.log('  ', await syncAll())
const { rows: check } = await pool.query('SELECT name, avg_rating, review_count FROM restaurants ORDER BY avg_rating DESC LIMIT 3')
console.log('  top rated:', check.map((r) => `${r.name} ${r.avg_rating} (${r.review_count})`).join(', '))

await mongo.close()
await pool.end()
