import type { Cuisine } from '../types'
import { photo } from './images'

const rows: [string, string, string][] = [
  ['south-indian', 'South Indian', 'p02'],
  ['udupi', 'Udupi', 'p05'],
  ['karnataka-meals', 'Karnataka Meals', 'p03'],
  ['andhra', 'Andhra', 'p12'],
  ['coastal', 'Coastal', 'p06'],
  ['biryani', 'Biryani', 'p10'],
  ['north-indian', 'North Indian', 'p20'],
  ['mughlai', 'Mughlai', 'p23'],
  ['street-food', 'Street Food', 'p13'],
  ['cafe', 'Café', 'p26'],
  ['bakery', 'Bakery', 'p27'],
  ['italian', 'Italian', 'p32'],
  ['japanese', 'Japanese', 'p40'],
  ['pan-asian', 'Pan-Asian', 'p41'],
  ['tibetan', 'Tibetan', 'p60'],
  ['american', 'American', 'p45'],
  ['continental', 'Continental', 'p30'],
  ['desserts', 'Desserts', 'p29'],
]

export const cuisines: Cuisine[] = rows.map(([slug, name, code], i) => ({
  id: i + 1,
  slug,
  name,
  imageUrl: photo(code, 480, 600),
}))

export const cuisineBySlug = (slug: string): Cuisine => {
  const c = cuisines.find((x) => x.slug === slug)
  if (!c) throw new Error(`Unknown cuisine ${slug}`)
  return c
}

/** Spice colour used to tint each cuisine's tile — keeps the colours popping. */
export const cuisineHue: Record<string, 'haldi' | 'chilli' | 'leaf' | 'kokum' | 'coconut'> = {
  'south-indian': 'haldi', udupi: 'leaf', 'karnataka-meals': 'leaf', andhra: 'chilli', coastal: 'coconut',
  biryani: 'haldi', 'north-indian': 'chilli', mughlai: 'kokum', 'street-food': 'chilli', cafe: 'haldi',
  bakery: 'kokum', italian: 'chilli', japanese: 'coconut', 'pan-asian': 'leaf', tibetan: 'coconut',
  american: 'chilli', continental: 'haldi', desserts: 'kokum',
}
