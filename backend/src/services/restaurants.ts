/** Creating a restaurant + its cuisines + its partner login — shared by partner self sign-up and the admin console. */
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { tx } from '../db/pg.ts'

const email = z.string().trim().toLowerCase().regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'Enter a valid email.').max(150)
const time = z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM.')

export const newRestaurantSchema = z.object({
  name: z.string().trim().min(2, 'Name the restaurant.').max(120),
  description: z.string().trim().max(600).default(''),
  area: z.string().trim().min(2, 'Pick an area.').max(60),
  address: z.string().trim().min(5, 'Add a street address.').max(255),
  costForTwo: z.number().int().positive('Cost for two must be more than ₹0.').max(100000),
  isPureVeg: z.boolean().default(false),
  opensAt: time, closesAt: time,
  cuisineIds: z.array(z.number().int().positive()).min(1, 'Pick at least one cuisine.').max(4),
  coverUrl: z.string().regex(/^(https:\/\/images\.unsplash\.com\/|\/uploads\/[a-z0-9-]+\.(jpg|png|webp)$)/, 'Pick or upload a cover photo.'),
  ownerName: z.string().trim().min(2, 'Tell us who runs it.').max(100),
  ownerEmail: email,
  ownerPassword: z.string().min(8, 'At least 8 characters.').max(200),
})
export type NewRestaurant = z.infer<typeof newRestaurantSchema>

export const priceLevel = (cost: number) => (cost <= 300 ? 1 : cost <= 700 ? 2 : cost <= 1200 ? 3 : 4)
const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'restaurant'

/** ONE transaction: the restaurant, its cuisine links and its owner login all exist, or none do. */
export async function createRestaurantWithOwner(b: NewRestaurant, status: 'pending' | 'approved') {
  const hash = await bcrypt.hash(b.ownerPassword, 10)
  return tx(async (c) => {
    const base = slugify(b.name)
    const { rows: taken } = await c.query<{ slug: string }>('SELECT slug FROM restaurants WHERE slug = $1 OR slug LIKE $2', [base, `${base}-%`])
    const slug = taken.length ? `${base}-${taken.length + 1}` : base
    const address = /bengaluru$/i.test(b.address) ? b.address : `${b.address}, Bengaluru`
    const { rows: [r] } = await c.query<{ id: number }>(
      `INSERT INTO restaurants (slug, name, description, address, area, price_level, cost_for_two, is_pure_veg,
                                opens_at, closes_at, cover_url, gallery_urls, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, ARRAY[$11], $12) RETURNING restaurant_id AS id`,
      [slug, b.name, b.description, address, b.area, priceLevel(b.costForTwo), b.costForTwo, b.isPureVeg, b.opensAt, b.closesAt, b.coverUrl, status])
    for (const cid of b.cuisineIds) await c.query('INSERT INTO restaurant_cuisines (restaurant_id, cuisine_id) VALUES ($1, $2)', [r.id, cid])
    const { rows: [o] } = await c.query<{ id: number }>(
      'INSERT INTO restaurant_owners (restaurant_id, full_name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING owner_id AS id',
      [r.id, b.ownerName, b.ownerEmail, hash])
    return { id: r.id, slug, ownerId: o.id }
  })
}
