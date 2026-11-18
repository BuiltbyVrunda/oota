/** Admin console — manage restaurants (and their partner logins), dishes, diners and reviews across both databases. */
import { Router } from 'express'
import { z } from 'zod'
import { pool, q, tx } from '../../db/pg.ts'
import { col } from '../../db/mongo.ts'
import { requireAdmin } from '../../middleware/auth.ts'
import { HttpError } from '../../middleware/error.ts'
import { body } from '../../middleware/validate.ts'
import { createDish, deleteDish, MANAGED_DISH_SELECT, newDishSchema, patchDishSchema, updateDish, type NewDish, type PatchDish } from '../../services/dishes.ts'
import { createRestaurantWithOwner, newRestaurantSchema, priceLevel, type NewRestaurant } from '../../services/restaurants.ts'
import { syncRestaurant } from '../../services/reviewSync.ts'
import { toReview } from '../../services/signals.ts'

export const adminRouter = Router()
adminRouter.use(requireAdmin)

adminRouter.get('/overview', async (_req, res) => {
  const [pg] = await q<Record<string, number>>(
    `SELECT (SELECT COUNT(*) FROM users)::int AS diners, (SELECT COUNT(*) FROM restaurants)::int AS restaurants,
            (SELECT COUNT(*) FROM restaurant_owners)::int AS partners, (SELECT COUNT(*) FROM dishes)::int AS dishes,
            (SELECT COUNT(*) FROM orders)::int AS orders, (SELECT COALESCE(SUM(total_amount), 0) FROM orders)::float AS gmv,
            (SELECT COUNT(*) FROM users WHERE created_at > now() - interval '7 days')::int AS "newDiners7d",
            (SELECT COUNT(*) FROM restaurants WHERE status = 'pending')::int AS pending`)
  const reviews = await col.reviews().countDocuments()
  res.json({ ...pg, reviews })
})

/* ------------------------------------------------------------------ restaurants */

adminRouter.get('/restaurants', async (_req, res) => {
  res.json(await q(
    `SELECT r.restaurant_id AS id, r.slug, r.name, r.area, r.cost_for_two AS "costForTwo", r.price_level AS "priceLevel",
            r.is_pure_veg AS "isPureVeg", r.status, r.created_at AS "createdAt", r.avg_rating::float AS "avgRating", r.review_count AS "reviewCount", r.cover_url AS "coverUrl",
            to_char(r.opens_at, 'HH24:MI') AS "opensAt", to_char(r.closes_at, 'HH24:MI') AS "closesAt", r.trending_score AS "trendingScore",
            o.email AS "ownerEmail", o.full_name AS "ownerName",
            COUNT(DISTINCT d.dish_id)::int AS dishes,
            COALESCE(array_agg(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL), '{}') AS cuisines
       FROM restaurants r
       LEFT JOIN restaurant_owners o  ON o.restaurant_id = r.restaurant_id
       LEFT JOIN dishes d             ON d.restaurant_id = r.restaurant_id
       LEFT JOIN restaurant_cuisines rc ON rc.restaurant_id = r.restaurant_id
       LEFT JOIN cuisines c           ON c.cuisine_id = rc.cuisine_id
      GROUP BY r.restaurant_id, o.email, o.full_name
      ORDER BY (r.status = 'pending') DESC, r.name`))
})

/** Admin-created restaurants go live immediately. */
adminRouter.post('/restaurants', body(newRestaurantSchema), async (req, res) => {
  const out = await createRestaurantWithOwner(req.body as NewRestaurant, 'approved')
  res.status(201).json(out)
})

const time = z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM.')
const patchRestaurant = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
  name: z.string().trim().min(2).max(120), description: z.string().trim().max(600), area: z.string().trim().min(2).max(60),
  costForTwo: z.number().int().positive().max(100000), isPureVeg: z.boolean(), opensAt: time, closesAt: time,
  trendingScore: z.number().int().min(0).max(100),
}).partial()

adminRouter.patch('/restaurants/:id', body(patchRestaurant), async (req, res) => {
  const p = req.body as z.infer<typeof patchRestaurant>
  const map: Record<string, [string, unknown]> = {}
  if (p.name !== undefined) map.name = ['name', p.name]
  if (p.description !== undefined) map.description = ['description', p.description]
  if (p.area !== undefined) map.area = ['area', p.area]
  if (p.costForTwo !== undefined) { map.cost = ['cost_for_two', p.costForTwo]; map.level = ['price_level', priceLevel(p.costForTwo)] }
  if (p.isPureVeg !== undefined) map.veg = ['is_pure_veg', p.isPureVeg]
  if (p.opensAt !== undefined) map.opens = ['opens_at', p.opensAt]
  if (p.closesAt !== undefined) map.closes = ['closes_at', p.closesAt]
  if (p.trendingScore !== undefined) map.trend = ['trending_score', p.trendingScore]
  if (p.status !== undefined) map.status = ['status', p.status] // approve / reject a partner sign-up
  const cols = Object.values(map)
  if (cols.length) {
    const sql = `UPDATE restaurants SET ${cols.map(([c], i) => `${c} = $${i + 1}`).join(', ')} WHERE restaurant_id = $${cols.length + 1} RETURNING restaurant_id`
    const rows = await q(sql, [...cols.map(([, v]) => v), Number(req.params.id)])
    if (!rows.length) throw new HttpError(404, 'NOT_FOUND', 'No such restaurant.')
  }
  res.json({ ok: true })
})

/**
 * Delete a restaurant everywhere. Postgres: its orders first (order_items → dishes is RESTRICT), then the restaurant
 * (cascades to dishes, menu sections, cuisines link, favourites, partner login). Mongo: its reviews and views.
 */
adminRouter.delete('/restaurants/:id', async (req, res) => {
  const id = Number(req.params.id)
  const name = await tx(async (c) => {
    await c.query('DELETE FROM orders WHERE restaurant_id = $1', [id])
    const { rows } = await c.query<{ name: string }>('DELETE FROM restaurants WHERE restaurant_id = $1 RETURNING name', [id])
    if (!rows.length) throw new HttpError(404, 'NOT_FOUND', 'No such restaurant.')
    return rows[0].name
  })
  const [rv, vw] = await Promise.all([col.reviews().deleteMany({ restaurantId: id }), col.views().deleteMany({ restaurantId: id })])
  res.json({ deleted: name, mongo: { reviews: rv.deletedCount, views: vw.deletedCount } })
})

/* ------------------------------------------------------------------ dishes */

adminRouter.get('/dishes', async (req, res) => {
  const search = String(req.query.q ?? '').trim()
  res.json(await q(
    `${MANAGED_DISH_SELECT}
      WHERE ($1 = '' OR d.name ILIKE '%' || $1 || '%' OR r.name ILIKE '%' || $1 || '%')
      ORDER BY r.name, mc.sort_order, d.dish_id LIMIT 400`, [search]))
})
adminRouter.post('/restaurants/:id/dishes', body(newDishSchema), async (req, res) => {
  res.status(201).json(await createDish(Number(req.params.id), req.body as NewDish))
})
adminRouter.patch('/dishes/:id', body(patchDishSchema), async (req, res) => {
  res.json(await updateDish(Number(req.params.id), null, req.body as PatchDish))
})
adminRouter.delete('/dishes/:id', async (req, res) => {
  await deleteDish(Number(req.params.id), null)
  res.status(204).end()
})

/* ------------------------------------------------------------------ diners */

adminRouter.get('/users', async (_req, res) => {
  const users = await q<{ id: number; fullName: string; email: string; createdAt: string; saves: number; orders: number }>(
    `SELECT u.user_id AS id, u.full_name AS "fullName", u.email, u.created_at AS "createdAt",
            (SELECT COUNT(*) FROM favourite_restaurants f WHERE f.user_id = u.user_id)::int AS saves,
            (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.user_id)::int AS orders
       FROM users u ORDER BY u.user_id`)
  // reviews per diner from MongoDB ($group by userId) merged in by id
  const counts = await col.reviews().aggregate<{ _id: number; n: number }>([{ $group: { _id: '$userId', n: { $sum: 1 } } }]).toArray()
  const byId = new Map(counts.map((c) => [c._id, c.n]))
  res.json(users.map((u) => ({ ...u, reviews: byId.get(u.id) ?? 0 })))
})

/** Delete a diner from BOTH databases, then re-sync the ratings their reviews contributed to. */
adminRouter.delete('/users/:id', async (req, res) => {
  const id = Number(req.params.id)
  const reviewed = await col.reviews().find({ userId: id }).project<{ restaurantId: number; dishRatings: { dishId: number }[] }>({ restaurantId: 1, dishRatings: 1 }).toArray()
  const { rowCount } = await pool.query('DELETE FROM users WHERE user_id = $1', [id]) // cascades favourites + orders
  if (!rowCount) throw new HttpError(404, 'NOT_FOUND', 'No such diner.')
  await Promise.all([
    col.prefs().deleteOne({ _id: id }), col.reviews().deleteMany({ userId: id }),
    col.searches().deleteMany({ userId: id }), col.views().deleteMany({ userId: id }),
  ])
  for (const r of reviewed) await syncRestaurant(r.restaurantId, r.dishRatings.map((d) => d.dishId))
  res.json({ ok: true, resynced: reviewed.length })
})

/* ------------------------------------------------------------------ reviews */

adminRouter.get('/reviews', async (_req, res) => {
  const docs = await col.reviews().find({}).sort({ updatedAt: -1, createdAt: -1 }).limit(60).toArray()
  const names = new Map((await q<{ id: number; name: string }>('SELECT restaurant_id AS id, name FROM restaurants')).map((r) => [r.id, r.name]))
  res.json(docs.map((d) => ({ ...toReview(d), restaurantName: names.get(d.restaurantId) ?? 'Deleted restaurant' })))
})

/** Moderation: remove a review (Mongo) and re-sync that restaurant's cached rating (Postgres). */
adminRouter.delete('/reviews/:id', async (req, res) => {
  const { ObjectId } = await import('mongodb')
  if (!ObjectId.isValid(req.params.id)) throw new HttpError(400, 'BAD_ID', 'Invalid review id.')
  const doc = await col.reviews().findOneAndDelete({ _id: new ObjectId(req.params.id) })
  if (!doc) throw new HttpError(404, 'NOT_FOUND', 'No such review.')
  const stats = await syncRestaurant(doc.restaurantId, doc.dishRatings.map((d) => d.dishId))
  res.json({ restaurant: { id: doc.restaurantId, avgRating: Math.round(stats.avg * 10) / 10, reviewCount: stats.count } })
})
