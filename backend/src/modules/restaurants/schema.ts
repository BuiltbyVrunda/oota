import { z } from 'zod'

const list = (inner: z.ZodType) =>
  z.preprocess((v) => (v === undefined || v === '' ? [] : Array.isArray(v) ? v : String(v).split(',')), z.array(inner))

export const discoverQuery = z.object({
  q: z.string().trim().max(100).optional().default(''),
  cuisine: list(z.coerce.number().int().positive()),
  diet: z.enum(['any', 'veg', 'egg', 'nonveg', 'vegan']).optional().default('any'),
  price: list(z.coerce.number().int().min(1).max(4)),
  minRating: z.coerce.number().min(0).max(5).optional().default(0),
  flavour: list(z.enum(['spicy', 'tangy', 'sweet', 'creamy', 'smoky', 'mild', 'rich', 'fresh', 'crispy', 'comforting'])),
  sort: z.enum(['match', 'rating', 'price']).optional().default('match'),
  limit: z.coerce.number().int().min(1).max(250).optional().default(250),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

export interface DiscoverQuery {
  q: string; cuisine: number[]; diet: 'any' | 'veg' | 'egg' | 'nonveg' | 'vegan'; price: number[]
  minRating: number; flavour: string[]; sort: 'match' | 'rating' | 'price'; limit: number; offset: number
}

export const DIETS_FOR_FILTER = {
  any: ['veg', 'egg', 'nonveg', 'vegan'], veg: ['veg', 'vegan'], egg: ['veg', 'egg', 'vegan'], nonveg: ['nonveg'], vegan: ['vegan'],
} as const

/** 'dos mas' → 'dos:* & mas:*' — a prefix full-text query, so typing "dos" already finds "dosa". */
export function prefixTsQuery(text: string): string | null {
  const words = text.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N} ]+/gu, ' ').split(/\s+/).filter((w) => w.length > 1)
  return words.length ? words.map((w) => `${w}:*`).join(' & ') : null
}
