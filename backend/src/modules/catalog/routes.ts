import { Router } from 'express'
import { q } from '../../db/pg.ts'
import { HttpError } from '../../middleware/error.ts'
import { DISH_SELECT, RESTAURANT_SELECT, getCatalog, getCuisines } from '../../services/catalog.ts'
import type { Dish, Restaurant } from '../../shared/types.ts'

export const catalogRouter = Router()

catalogRouter.get('/cuisines', async (_req, res) => { res.json(await getCuisines()) })

/** Everything the UI needs to render cards, in one round trip. Refetched whenever the DB changes. */
catalogRouter.get('/catalog', async (_req, res) => { res.json(await getCatalog()) })

/** One restaurant + its menu grouped by category (sort_order). */
catalogRouter.get('/restaurants/:slug', async (req, res) => {
  const [restaurant] = await q<Restaurant>(`${RESTAURANT_SELECT} WHERE r.slug = $1 AND r.status = 'approved' GROUP BY r.restaurant_id`, [req.params.slug])
  if (!restaurant) throw new HttpError(404, 'NOT_FOUND', 'This restaurant isn’t on Oota.')
  const dishes = await q<Dish>(`${DISH_SELECT} WHERE d.restaurant_id = $1 AND d.is_available ORDER BY mc.sort_order, d.dish_id`, [restaurant.id])
  const menu: { category: string; dishes: Dish[] }[] = []
  for (const d of dishes) {
    const last = menu[menu.length - 1]
    if (last?.category === d.category) last.dishes.push(d)
    else menu.push({ category: d.category, dishes: [d] })
  }
  res.json({ restaurant, menu })
})
