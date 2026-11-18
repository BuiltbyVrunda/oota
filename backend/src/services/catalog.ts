/** Loads the catalogue from PostgreSQL in the exact shape the frontend types use. */
import { q } from '../db/pg.ts'
import type { Cuisine, Dish, Restaurant } from '../shared/types.ts'

export const RESTAURANT_SELECT = `
  SELECT r.restaurant_id AS id, r.slug, r.name, COALESCE(r.description, '') AS description, r.area, r.address,
         r.price_level AS "priceLevel", r.cost_for_two AS "costForTwo", r.is_pure_veg AS "isPureVeg",
         to_char(r.opens_at, 'HH24:MI') AS "opensAt", to_char(r.closes_at, 'HH24:MI') AS "closesAt",
         COALESCE(r.cover_url, '') AS "coverUrl", r.gallery_urls AS "galleryUrls",
         COALESCE(array_agg(rc.cuisine_id ORDER BY rc.cuisine_id) FILTER (WHERE rc.cuisine_id IS NOT NULL), '{}') AS "cuisineIds",
         r.avg_rating::float AS "avgRating", r.review_count AS "reviewCount", r.trending_score AS "trendingScore"
    FROM restaurants r
    LEFT JOIN restaurant_cuisines rc ON rc.restaurant_id = r.restaurant_id`

export const DISH_SELECT = `
  SELECT d.dish_id AS id, d.restaurant_id AS "restaurantId", mc.name AS category, d.cuisine_id AS "cuisineId",
         d.name, COALESCE(d.description, '') AS description, d.price::float AS price, d.diet,
         d.spice_level AS "spiceLevel", d.flavour_tags AS "flavourTags", d.allergens,
         COALESCE(d.image_url, '') AS "imageUrl", d.avg_rating::float AS "avgRating", d.review_count AS "reviewCount"
    FROM dishes d
    JOIN menu_categories mc ON mc.category_id = d.category_id`

export const getCuisines = () =>
  q<Cuisine>(`SELECT cuisine_id AS id, slug, name, COALESCE(image_url, '') AS "imageUrl" FROM cuisines ORDER BY cuisine_id`)

/** Diners only ever see approved restaurants (pending partner sign-ups are hidden). */
export const getRestaurants = () => q<Restaurant>(`${RESTAURANT_SELECT} WHERE r.status = 'approved' GROUP BY r.restaurant_id ORDER BY r.restaurant_id`)

export const getDishes = () => q<Dish>(`${DISH_SELECT} JOIN restaurants rs ON rs.restaurant_id = d.restaurant_id AND rs.status = 'approved' WHERE d.is_available ORDER BY d.restaurant_id, mc.sort_order, d.dish_id`)

export async function getCatalog() {
  const [cuisines, restaurants, dishes] = await Promise.all([getCuisines(), getRestaurants(), getDishes()])
  return { cuisines, restaurants, dishes }
}
