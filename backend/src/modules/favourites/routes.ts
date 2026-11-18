import { Router } from 'express'
import { q } from '../../db/pg.ts'
import { requireUser } from '../../middleware/auth.ts'

export const favouritesRouter = Router()

favouritesRouter.get('/me/favourites', requireUser, async (req, res) => {
  const rows = await q<{ id: number }>('SELECT restaurant_id AS id FROM favourite_restaurants WHERE user_id = $1 ORDER BY saved_at DESC', [req.user!.id])
  res.json(rows.map((r) => r.id))
})

/** PUT is idempotent thanks to the composite primary key (user_id, restaurant_id). */
favouritesRouter.put('/me/favourites/:restaurantId', requireUser, async (req, res) => {
  await q('INSERT INTO favourite_restaurants (user_id, restaurant_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.user!.id, Number(req.params.restaurantId)])
  res.status(204).end()
})

favouritesRouter.delete('/me/favourites/:restaurantId', requireUser, async (req, res) => {
  await q('DELETE FROM favourite_restaurants WHERE user_id = $1 AND restaurant_id = $2', [req.user!.id, Number(req.params.restaurantId)])
  res.status(204).end()
})
