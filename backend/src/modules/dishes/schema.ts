import { z } from 'zod'

const FLAVOURS = ['spicy', 'tangy', 'sweet', 'creamy', 'smoky', 'mild', 'rich', 'fresh', 'crispy', 'comforting'] as const
const ALLERGENS = ['nuts', 'dairy', 'gluten', 'egg', 'shellfish', 'soy'] as const

export const newDishSchema = z.object({
  restaurantId: z.number().int().positive(),
  category: z.string().trim().min(2, 'Name the menu section.').max(60),
  cuisineId: z.number().int().positive().optional(),
  name: z.string().trim().min(2, 'Give the dish a name.').max(120),
  description: z.string().trim().max(400).default(''),
  price: z.number().positive('Price must be more than ₹0.').max(100000),
  diet: z.enum(['veg', 'egg', 'nonveg', 'vegan']),
  spiceLevel: z.number().int().min(0).max(3),
  flavourTags: z.array(z.enum(FLAVOURS)).max(5).default([]),
  allergens: z.array(z.enum(ALLERGENS)).max(6).default([]),
  imageUrl: z.string().url().regex(/^https:\/\/images\.unsplash\.com\//, 'Pick one of the photos.').optional(),
})
export type NewDish = z.infer<typeof newDishSchema>
