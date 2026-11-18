import { Router } from 'express'
import { pool } from '../../db/pg.ts'
import { col, mdb } from '../../db/mongo.ts'
import { requireAdmin, requireUser } from '../../middleware/auth.ts'
import { recentEvents, sseHandler } from '../../services/realtime.ts'
import { syncAll } from '../../services/reviewSync.ts'

export const PG_TABLES = ['users', 'restaurant_owners', 'admins', 'cuisines', 'restaurants', 'restaurant_cuisines', 'menu_categories', 'dishes', 'favourite_restaurants', 'orders', 'order_items'] as const
export const MONGO_COLLECTIONS = ['user_preferences', 'reviews', 'search_history', 'restaurant_views'] as const

export const systemRouter = Router()

systemRouter.get('/health', async (_req, res) => {
  const out: Record<string, string> = {}
  try { await pool.query('SELECT 1'); out.postgres = 'up' } catch { out.postgres = 'down' }
  try { await mdb().command({ ping: 1 }); out.mongo = 'up' } catch { out.mongo = 'down' }
  res.status(out.postgres === 'up' && out.mongo === 'up' ? 200 : 503).json(out)
})

/** Live view of both databases for the demo page: row/document counts, and which tables are missing. */
systemRouter.get('/system/status', async (_req, res) => {
  const tables = await Promise.all(PG_TABLES.map(async (t) => {
    try {
      const { rows } = await pool.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM ${t}`)
      return { name: t, rows: rows[0].n, missing: false }
    } catch {
      return { name: t, rows: 0, missing: true }
    }
  }))
  const views = await Promise.all(['v_restaurant_summary', 'v_popular_dishes'].map(async (v) => {
    try { const { rows } = await pool.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM ${v}`); return { name: v, rows: rows[0].n, missing: false } }
    catch { return { name: v, rows: 0, missing: true } }
  }))
  let collections: { name: string; docs: number }[] = []
  let mongo = 'up'
  try {
    collections = await Promise.all(MONGO_COLLECTIONS.map(async (c) => ({ name: c, docs: await mdb().collection(c).countDocuments() })))
  } catch { mongo = 'down' }
  res.json({ postgres: tables.every((t) => t.missing) ? 'empty' : 'up', mongo, tables, views, collections, events: recentEvents() })
})

/** Server-Sent Events: pushes every database change (Postgres NOTIFY + Mongo change stream) to the browser. */
systemRouter.get('/events', sseHandler)

/** Re-run the idempotent review sync (repair path for the cross-database cache). */
systemRouter.post('/system/resync', requireAdmin, async (_req, res) => { res.json(await syncAll()) })

/** Aggregation pipeline #2: a user's favourite review tags ($unwind → $group → $sort). */
systemRouter.get('/me/insights', requireUser, async (req, res) => {
  const tags = await col.reviews().aggregate<{ tag: string; count: number; avgRating: number }>([
    { $match: { userId: req.user!.id } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
    { $sort: { count: -1, avgRating: -1 } },
    { $limit: 8 },
    { $project: { _id: 0, tag: '$_id', count: 1, avgRating: { $round: ['$avgRating', 1] } } },
  ]).toArray()
  res.json({ tags })
})
