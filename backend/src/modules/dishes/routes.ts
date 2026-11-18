import { Router } from 'express'
import { tx } from '../../db/pg.ts'
import { requireUser } from '../../middleware/auth.ts'
import { HttpError } from '../../middleware/error.ts'
import { body, query } from '../../middleware/validate.ts'
import { DISH_SELECT } from '../../services/catalog.ts'
import type { Dish } from '../../shared/types.ts'
import { newDishSchema, type NewDish } from './schema.ts'
import { discoverQuery, type DiscoverQuery } from '../restaurants/schema.ts'
import { discoverDishes } from '../restaurants/service.ts'

/** GET /api/dishes?q&cuisine=&diet=&price=&minRating=&flavour=&sort= — PostgreSQL full-text search + ILIKE fallback */
export const dishesRouter = Router()
dishesRouter.get('/dishes', query(discoverQuery), async (req, res) => {
  res.json(await discoverDishes(res.locals.query as DiscoverQuery, req.user?.id))
})

/**
 * POST /api/dishes — any logged-in diner can add a dish to any menu.
 * One transaction: find-or-create the menu section (UNIQUE (restaurant_id, name) + ON CONFLICT), then insert the dish.
 * trg_dish_search_vector fills the full-text vector; the notify trigger tells every open browser.
 */
dishesRouter.post('/dishes', requireUser, body(newDishSchema), async (req, res) => {
  const d = req.body as NewDish
  const dish = await tx(async (c) => {
    const { rows: [r] } = await c.query<{ cuisine: number | null }>(
      `SELECT (SELECT MIN(cuisine_id) FROM restaurant_cuisines WHERE restaurant_id = $1) AS cuisine
         FROM restaurants WHERE restaurant_id = $1`, [d.restaurantId])
    if (!r) throw new HttpError(404, 'NOT_FOUND', 'That restaurant isn’t on Oota.', { restaurantId: 'Pick a restaurant.' })
    const cuisineId = d.cuisineId ?? r.cuisine
    if (!cuisineId) throw new HttpError(400, 'NO_CUISINE', 'This restaurant has no cuisine set, so pick one.', { cuisineId: 'Pick a cuisine.' })
    const { rows: [cat] } = await c.query<{ id: number }>(
      `INSERT INTO menu_categories (restaurant_id, name, sort_order)
       VALUES ($1, $2, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM menu_categories WHERE restaurant_id = $1))
       ON CONFLICT (restaurant_id, name) DO UPDATE SET name = EXCLUDED.name
       RETURNING category_id AS id`, [d.restaurantId, d.category])
    const { rows: [ins] } = await c.query<{ id: number }>(
      `INSERT INTO dishes (restaurant_id, category_id, cuisine_id, name, description, price, diet, spice_level, flavour_tags, allergens, image_url, added_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING dish_id AS id`,
      [d.restaurantId, cat.id, cuisineId, d.name, d.description, d.price, d.diet, d.spiceLevel, d.flavourTags, d.allergens, d.imageUrl ?? null, req.user!.id])
    const { rows: [full] } = await c.query<Dish>(`${DISH_SELECT} WHERE d.dish_id = $1`, [ins.id])
    return full
  })
  res.status(201).json(dish)
})
