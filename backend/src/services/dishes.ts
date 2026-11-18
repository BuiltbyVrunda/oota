/** Dish writes shared by the partner portal (own restaurant) and the admin console (any restaurant). */
import type pg from 'pg'
import { z } from 'zod'
import { q, tx } from '../db/pg.ts'
import { HttpError } from '../middleware/error.ts'
import { DISH_SELECT } from './catalog.ts'
import type { Dish } from '../shared/types.ts'

const FLAVOURS = ['spicy', 'tangy', 'sweet', 'creamy', 'smoky', 'mild', 'rich', 'fresh', 'crispy', 'comforting'] as const
const ALLERGENS = ['nuts', 'dairy', 'gluten', 'egg', 'shellfish', 'soy'] as const

export const dishFields = {
  category: z.string().trim().min(2, 'Name the menu section.').max(60),
  name: z.string().trim().min(2, 'Give the dish a name.').max(120),
  description: z.string().trim().max(400),
  price: z.number().positive('Price must be more than ₹0.').max(100000),
  diet: z.enum(['veg', 'egg', 'nonveg', 'vegan']),
  spiceLevel: z.number().int().min(0).max(3),
  flavourTags: z.array(z.enum(FLAVOURS)).max(5),
  allergens: z.array(z.enum(ALLERGENS)).max(6),
  imageUrl: z.string().regex(/^(https:\/\/images\.unsplash\.com\/|\/uploads\/[a-z0-9-]+\.(jpg|png|webp)$)/, 'Pick or upload a photo.').nullable(),
  isAvailable: z.boolean(),
}
export const newDishSchema = z.object({
  ...dishFields,
  description: dishFields.description.default(''),
  flavourTags: dishFields.flavourTags.default([]),
  allergens: dishFields.allergens.default([]),
  imageUrl: dishFields.imageUrl.optional(),
  isAvailable: dishFields.isAvailable.default(true),
})
export const patchDishSchema = z.object(dishFields).partial()
export type NewDish = z.infer<typeof newDishSchema>
export type PatchDish = z.infer<typeof patchDishSchema>

export interface ManagedDish extends Dish { isAvailable: boolean; createdAt: string; timesOrdered: number }
export const MANAGED_DISH_SELECT = `
  SELECT d.dish_id AS id, d.restaurant_id AS "restaurantId", mc.name AS category, d.cuisine_id AS "cuisineId",
         d.name, COALESCE(d.description, '') AS description, d.price::float AS price, d.diet,
         d.spice_level AS "spiceLevel", d.flavour_tags AS "flavourTags", d.allergens,
         COALESCE(d.image_url, '') AS "imageUrl", d.avg_rating::float AS "avgRating", d.review_count AS "reviewCount",
         d.is_available AS "isAvailable", d.created_at AS "createdAt",
         COALESCE((SELECT SUM(oi.quantity) FROM order_items oi WHERE oi.dish_id = d.dish_id), 0)::int AS "timesOrdered",
         r.name AS "restaurantName"
    FROM dishes d
    JOIN menu_categories mc ON mc.category_id = d.category_id
    JOIN restaurants r ON r.restaurant_id = d.restaurant_id`

/** Find-or-create the menu section (UNIQUE (restaurant_id, name) + ON CONFLICT), returns its id. */
async function sectionId(c: pg.PoolClient, restaurantId: number, name: string) {
  const { rows: [cat] } = await c.query<{ id: number }>(
    `INSERT INTO menu_categories (restaurant_id, name, sort_order)
     VALUES ($1, $2, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM menu_categories WHERE restaurant_id = $1))
     ON CONFLICT (restaurant_id, name) DO UPDATE SET name = EXCLUDED.name
     RETURNING category_id AS id`, [restaurantId, name])
  return cat.id
}

/** One transaction: section find-or-create + dish insert. trg_dish_search_vector indexes it for full-text search. */
export async function createDish(restaurantId: number, d: NewDish): Promise<Dish> {
  return tx(async (c) => {
    const { rows: [r] } = await c.query<{ cuisine: number | null }>(
      'SELECT (SELECT MIN(cuisine_id) FROM restaurant_cuisines WHERE restaurant_id = $1) AS cuisine FROM restaurants WHERE restaurant_id = $1', [restaurantId])
    if (!r) throw new HttpError(404, 'NOT_FOUND', 'That restaurant isn’t on Oota.')
    if (!r.cuisine) throw new HttpError(400, 'NO_CUISINE', 'This restaurant has no cuisine set yet.')
    const cat = await sectionId(c, restaurantId, d.category)
    const { rows: [ins] } = await c.query<{ id: number }>(
      `INSERT INTO dishes (restaurant_id, category_id, cuisine_id, name, description, price, diet, spice_level, flavour_tags, allergens, image_url, is_available)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING dish_id AS id`,
      [restaurantId, cat, r.cuisine, d.name, d.description, d.price, d.diet, d.spiceLevel, d.flavourTags, d.allergens, d.imageUrl ?? null, d.isAvailable])
    const { rows: [full] } = await c.query<Dish>(`${DISH_SELECT} WHERE d.dish_id = $1`, [ins.id])
    return full
  })
}

/** Partial update. `restaurantId` scopes it (partners may only touch their own dishes); null = admin, any dish. */
export async function updateDish(dishId: number, restaurantId: number | null, p: PatchDish) {
  return tx(async (c) => {
    const { rows: [cur] } = await c.query<{ rid: number }>(
      'SELECT restaurant_id AS rid FROM dishes WHERE dish_id = $1 AND ($2::int IS NULL OR restaurant_id = $2)', [dishId, restaurantId])
    if (!cur) throw new HttpError(404, 'NOT_FOUND', 'That dish isn’t on your menu.')
    const sets: string[] = []
    const vals: unknown[] = []
    const set = (col: string, v: unknown) => { vals.push(v); sets.push(`${col} = $${vals.length}`) }
    if (p.category !== undefined) set('category_id', await sectionId(c, cur.rid, p.category))
    if (p.name !== undefined) set('name', p.name)
    if (p.description !== undefined) set('description', p.description)
    if (p.price !== undefined) set('price', p.price)
    if (p.diet !== undefined) set('diet', p.diet)
    if (p.spiceLevel !== undefined) set('spice_level', p.spiceLevel)
    if (p.flavourTags !== undefined) set('flavour_tags', p.flavourTags)
    if (p.allergens !== undefined) set('allergens', p.allergens)
    if (p.imageUrl !== undefined) set('image_url', p.imageUrl)
    if (p.isAvailable !== undefined) set('is_available', p.isAvailable)
    if (sets.length) {
      vals.push(dishId)
      await c.query(`UPDATE dishes SET ${sets.join(', ')} WHERE dish_id = $${vals.length}`, vals)
    }
    const { rows: [full] } = await c.query<ManagedDish>(`${MANAGED_DISH_SELECT} WHERE d.dish_id = $1`, [dishId])
    return full
  })
}

/** order_items → dishes is ON DELETE RESTRICT: a dish that has been ordered can't be deleted (order history stays intact). */
export async function deleteDish(dishId: number, restaurantId: number | null) {
  try {
    const rows = await q('DELETE FROM dishes WHERE dish_id = $1 AND ($2::int IS NULL OR restaurant_id = $2) RETURNING dish_id', [dishId, restaurantId])
    if (!rows.length) throw new HttpError(404, 'NOT_FOUND', 'That dish isn’t on your menu.')
  } catch (e) {
    if ((e as { code?: string }).code === '23503') {
      throw new HttpError(409, 'HAS_ORDERS', 'This dish has been ordered before, so it stays in order history. Mark it unavailable instead.')
    }
    throw e
  }
}
