import { Router } from 'express'
import { z } from 'zod'
import { q, tx } from '../../db/pg.ts'
import { requireUser } from '../../middleware/auth.ts'
import { HttpError } from '../../middleware/error.ts'
import { body } from '../../middleware/validate.ts'

const orderSchema = z.object({
  restaurantId: z.number().int().positive(),
  items: z.array(z.object({ dishId: z.number().int().positive(), quantity: z.number().int().min(1).max(20) })).min(1).max(30),
})

export const ordersRouter = Router()

/**
 * Transaction demo: the order row and all its line items commit together or not at all.
 * unit_price is copied from dishes at order time; trg_order_total keeps orders.total_amount = Σ(quantity × unit_price).
 * If any dish is not on this restaurant's menu, we throw → ROLLBACK → no half-written order.
 */
ordersRouter.post('/orders', requireUser, body(orderSchema), async (req, res) => {
  const { restaurantId, items } = req.body as z.infer<typeof orderSchema>
  const order = await tx(async (c) => {
    const { rows: [rest] } = await c.query("SELECT 1 FROM restaurants WHERE restaurant_id = $1 AND status = 'approved'", [restaurantId])
    if (!rest) throw new HttpError(404, 'NOT_FOUND', 'This restaurant isn’t taking orders.')
    const { rows: [o] } = await c.query<{ id: number }>(
      'INSERT INTO orders (user_id, restaurant_id) VALUES ($1, $2) RETURNING order_id AS id', [req.user!.id, restaurantId])
    for (const it of items) {
      const r = await c.query(
        `INSERT INTO order_items (order_id, dish_id, quantity, unit_price)
         SELECT $1, d.dish_id, $3, d.price FROM dishes d
          WHERE d.dish_id = $2 AND d.restaurant_id = $4 AND d.is_available
         ON CONFLICT (order_id, dish_id) DO UPDATE SET quantity = order_items.quantity + EXCLUDED.quantity`,
        [o.id, it.dishId, it.quantity, restaurantId])
      if (r.rowCount === 0) throw new HttpError(400, 'BAD_DISH', `Dish ${it.dishId} is not on this menu — order rolled back.`)
    }
    const { rows: [total] } = await c.query<{ total: number; status: string; placedAt: string }>(
      'SELECT total_amount::float AS total, status, placed_at AS "placedAt" FROM orders WHERE order_id = $1', [o.id])
    return { id: o.id, restaurantId, ...total }
  })
  res.status(201).json(order)
})

ordersRouter.get('/me/orders', requireUser, async (req, res) => {
  const rows = await q(
    `SELECT o.order_id AS id, o.restaurant_id AS "restaurantId", r.name AS "restaurantName", r.slug AS "restaurantSlug",
            r.cover_url AS "coverUrl", o.status,
            o.total_amount::float AS total, o.placed_at AS "placedAt",
            json_agg(json_build_object('dishId', oi.dish_id, 'name', d.name, 'quantity', oi.quantity, 'unitPrice', oi.unit_price::float)
                     ORDER BY d.name) AS items
       FROM orders o
       JOIN restaurants r  ON r.restaurant_id = o.restaurant_id
       JOIN order_items oi ON oi.order_id = o.order_id
       JOIN dishes d       ON d.dish_id = oi.dish_id
      WHERE o.user_id = $1
      GROUP BY o.order_id, r.restaurant_id   -- grouping by r's PK makes all r.* columns valid (functional dependency)
      ORDER BY o.placed_at DESC
      LIMIT 30`, [req.user!.id])
  res.json(rows)
})

/** A diner can cancel only while the kitchen hasn't started (status still PLACED) — enforced in the WHERE clause. */
ordersRouter.patch('/me/orders/:id/cancel', requireUser, async (req, res) => {
  const rows = await q("UPDATE orders SET status = 'CANCELLED' WHERE order_id = $1 AND user_id = $2 AND status = 'PLACED' RETURNING order_id", [Number(req.params.id), req.user!.id])
  if (!rows.length) throw new HttpError(409, 'TOO_LATE', 'This order can’t be cancelled any more — the kitchen has started it.')
  res.json({ ok: true })
})
