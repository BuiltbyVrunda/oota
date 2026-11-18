/**
 * Review → rating sync: the key cross-database flow.
 * Reviews live in MongoDB; restaurants.avg_rating/review_count and dishes.avg_rating/review_count in Postgres
 * are a CACHE of the Mongo aggregate. Order: write Mongo first, then recompute + UPDATE Postgres.
 * The recompute is idempotent, so if the Postgres step fails, re-running sync fixes it (no distributed transaction).
 */
import { pool } from '../db/pg.ts'
import { col } from '../db/mongo.ts'

/** Aggregation pipeline #1: per-restaurant average, count and 1–5★ distribution. */
export function restaurantStatsPipeline(restaurantIds?: number[]) {
  const bucket = (n: number) => ({ $sum: { $cond: [{ $eq: ['$rating', n] }, 1, 0] } })
  return [
    ...(restaurantIds ? [{ $match: { restaurantId: { $in: restaurantIds } } }] : []),
    { $group: { _id: '$restaurantId', avg: { $avg: '$rating' }, count: { $sum: 1 }, r1: bucket(1), r2: bucket(2), r3: bucket(3), r4: bucket(4), r5: bucket(5) } },
    { $sort: { _id: 1 } },
  ]
}

/** Per-dish average from the embedded dishRatings arrays ($unwind + $group). */
export function dishStatsPipeline(dishIds?: number[]) {
  const match = dishIds ? [{ $match: { 'dishRatings.dishId': { $in: dishIds } } }] : []
  return [
    ...match,
    { $unwind: '$dishRatings' },
    ...(dishIds ? [{ $match: { 'dishRatings.dishId': { $in: dishIds } } }] : []),
    { $group: { _id: '$dishRatings.dishId', avg: { $avg: '$dishRatings.rating' }, count: { $sum: 1 } } },
  ]
}

interface Stat { _id: number; avg: number; count: number }

async function writeRestaurantStats(ids: number[], stats: Stat[]) {
  const by = new Map(stats.map((s) => [s._id, s]))
  for (const id of ids) {
    const s = by.get(id)
    await pool.query('UPDATE restaurants SET avg_rating = ROUND($2::numeric, 1), review_count = $3 WHERE restaurant_id = $1', [id, s?.avg ?? 0, s?.count ?? 0])
  }
}
async function writeDishStats(ids: number[], stats: Stat[]) {
  const by = new Map(stats.map((s) => [s._id, s]))
  for (const id of ids) {
    const s = by.get(id)
    await pool.query('UPDATE dishes SET avg_rating = ROUND($2::numeric, 1), review_count = $3 WHERE dish_id = $1', [id, s?.avg ?? 0, s?.count ?? 0])
  }
}

/** Recompute one restaurant (and the dishes touched) after a review upsert/delete. */
export async function syncRestaurant(restaurantId: number, dishIds: number[]) {
  const rs = await col.reviews().aggregate<Stat>(restaurantStatsPipeline([restaurantId])).toArray()
  await writeRestaurantStats([restaurantId], rs)
  if (dishIds.length) {
    const ds = await col.reviews().aggregate<Stat>(dishStatsPipeline(dishIds)).toArray()
    await writeDishStats(dishIds, ds)
  }
  return rs[0] ?? { _id: restaurantId, avg: 0, count: 0 }
}

/** Full re-sync (seed / repair). Safe to run any time. */
export async function syncAll() {
  const [rIds, dIds] = await Promise.all([
    pool.query<{ id: number }>('SELECT restaurant_id AS id FROM restaurants'),
    pool.query<{ id: number }>('SELECT dish_id AS id FROM dishes'),
  ])
  const rs = await col.reviews().aggregate<Stat>(restaurantStatsPipeline()).toArray()
  const ds = await col.reviews().aggregate<Stat>(dishStatsPipeline()).toArray()
  await writeRestaurantStats(rIds.rows.map((r) => r.id), rs)
  await writeDishStats(dIds.rows.map((r) => r.id), ds)
  return { restaurants: rs.length, dishes: ds.length }
}
