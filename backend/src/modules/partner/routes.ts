/** Restaurant partner portal — everything is scoped to the signed-in owner's restaurant (req.partner.restaurantId). */
import { Router } from 'express'
import { q } from '../../db/pg.ts'
import { col } from '../../db/mongo.ts'
import { requirePartner } from '../../middleware/auth.ts'
import { HttpError } from '../../middleware/error.ts'
import { z } from 'zod'
import { body } from '../../middleware/validate.ts'
import { RESTAURANT_SELECT } from '../../services/catalog.ts'
import { createDish, deleteDish, MANAGED_DISH_SELECT, newDishSchema, patchDishSchema, updateDish, type NewDish, type PatchDish } from '../../services/dishes.ts'
import { restaurantStatsPipeline } from '../../services/reviewSync.ts'
import { toReview } from '../../services/signals.ts'
import type { Restaurant } from '../../shared/types.ts'

export const partnerRouter = Router()
partnerRouter.use(requirePartner)

partnerRouter.get('/overview', async (req, res) => {
  const rid = req.partner!.restaurantId
  const [restaurant] = await q<Restaurant>(`${RESTAURANT_SELECT} WHERE r.restaurant_id = $1 GROUP BY r.restaurant_id`, [rid])
  if (!restaurant) throw new HttpError(404, 'NOT_FOUND', 'Your restaurant no longer exists.')
  // one round trip: scalar subqueries + an aggregate over the last 30 days of orders
  const [stats] = await q<{ dishes: number; available: number; sections: number; saves: number; orders30: number; revenue30: number; unitsSold: number }>(
    `SELECT (SELECT COUNT(*) FROM dishes WHERE restaurant_id = $1)::int                       AS dishes,
            (SELECT COUNT(*) FROM dishes WHERE restaurant_id = $1 AND is_available)::int      AS available,
            (SELECT COUNT(*) FROM menu_categories WHERE restaurant_id = $1)::int              AS sections,
            (SELECT COUNT(*) FROM favourite_restaurants WHERE restaurant_id = $1)::int        AS saves,
            COUNT(o.order_id)::int                                                            AS "orders30",
            COALESCE(SUM(o.total_amount), 0)::float                                           AS "revenue30",
            COALESCE((SELECT SUM(oi.quantity) FROM order_items oi JOIN orders o2 ON o2.order_id = oi.order_id
                       WHERE o2.restaurant_id = $1), 0)::int                                  AS "unitsSold"
       FROM orders o
      WHERE o.restaurant_id = $1 AND o.placed_at > now() - interval '30 days'`, [rid])
  // MongoDB aggregation pipeline: rating distribution for this restaurant
  const [dist] = await col.reviews().aggregate<{ avg: number; count: number; r1: number; r2: number; r3: number; r4: number; r5: number }>(restaurantStatsPipeline([rid])).toArray()
  res.json({ restaurant, stats, ratings: dist ?? { avg: 0, count: 0, r1: 0, r2: 0, r3: 0, r4: 0, r5: 0 } })
})

partnerRouter.get('/menu', async (req, res) => {
  res.json(await q(`${MANAGED_DISH_SELECT} WHERE d.restaurant_id = $1 ORDER BY mc.sort_order, d.dish_id`, [req.partner!.restaurantId]))
})

partnerRouter.post('/dishes', body(newDishSchema), async (req, res) => {
  res.status(201).json(await createDish(req.partner!.restaurantId, req.body as NewDish))
})

partnerRouter.patch('/dishes/:id', body(patchDishSchema), async (req, res) => {
  res.json(await updateDish(Number(req.params.id), req.partner!.restaurantId, req.body as PatchDish))
})

partnerRouter.delete('/dishes/:id', async (req, res) => {
  await deleteDish(Number(req.params.id), req.partner!.restaurantId)
  res.status(204).end()
})

partnerRouter.get('/reviews', async (req, res) => {
  const docs = await col.reviews().find({ restaurantId: req.partner!.restaurantId }).sort({ createdAt: -1 }).toArray()
  res.json(docs.map(toReview))
})

partnerRouter.get('/orders', async (req, res) => {
  res.json(await q(
    `SELECT o.order_id AS id, u.full_name AS "customer", o.status, o.total_amount::float AS total, o.placed_at AS "placedAt",
            json_agg(json_build_object('name', d.name, 'quantity', oi.quantity) ORDER BY d.name) AS items
       FROM orders o
       JOIN users u        ON u.user_id = o.user_id
       JOIN order_items oi ON oi.order_id = o.order_id
       JOIN dishes d       ON d.dish_id = oi.dish_id
      WHERE o.restaurant_id = $1
      GROUP BY o.order_id, u.full_name
      ORDER BY (o.status IN ('PLACED', 'PREPARING')) DESC, o.placed_at DESC LIMIT 40`, [req.partner!.restaurantId]))
})

/** Order status moves forward only: PLACED → PREPARING → DELIVERED, or → CANCELLED before delivery. */
const NEXT: Record<string, string[]> = { PREPARING: ['PLACED'], DELIVERED: ['PREPARING'], CANCELLED: ['PLACED', 'PREPARING'] }
partnerRouter.patch('/orders/:id', body(z.object({ status: z.enum(['PREPARING', 'DELIVERED', 'CANCELLED']) })), async (req, res) => {
  const { status } = req.body as { status: string }
  const rows = await q(
    'UPDATE orders SET status = $1 WHERE order_id = $2 AND restaurant_id = $3 AND status = ANY($4::text[]) RETURNING order_id',
    [status, Number(req.params.id), req.partner!.restaurantId, NEXT[status]])
  if (!rows.length) throw new HttpError(409, 'BAD_TRANSITION', `This order can’t move to ${status.toLowerCase()} from its current status.`)
  res.json({ ok: true })
})
