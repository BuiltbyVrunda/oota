import type { Flavour, Preferences, SearchEntry, ViewEntry } from '../types'

export interface SeedUser {
  id: number; fullName: string; email: string; password: string
  preferences?: Preferences
  searches?: { query: string; daysAgo: number; clickedSlug?: string }[]
  views?: { slug: string; daysAgo: number }[]
  favourites?: string[]
}

const pref = (cuisineSlugs: string[], diet: Preferences['diet'], spiceLevel: Preferences['spiceLevel'], flavours: Flavour[], allergens: string[] = []) =>
  ({ cuisineSlugs, diet, spiceLevel, flavours, allergens })

/** The three demo users (password demo1234). Their dashboards must look clearly different. */
export const demoUserSpecs = [
  { id: 1, fullName: 'Ananya Rao', email: 'ananya@oota.demo',
    pref: pref(['south-indian', 'udupi', 'karnataka-meals', 'cafe'], 'veg', 3, ['spicy', 'crispy', 'tangy']),
    searches: [{ query: 'ghee roast', daysAgo: 0.2 }, { query: 'filter coffee', daysAgo: 2, clickedSlug: 'degree-kaapi-co' }, { query: 'idli', daysAgo: 5 }],
    views: [{ slug: 'tuppa-and-co', daysAgo: 0.3 }, { slug: 'kempu-kitchen', daysAgo: 1 }, { slug: 'degree-kaapi-co', daysAgo: 2 }, { slug: 'appe-adda', daysAgo: 4 }],
    favourites: ['tuppa-and-co', 'degree-kaapi-co'] },
  { id: 2, fullName: 'Rohan Mehta', email: 'rohan@oota.demo',
    pref: pref(['biryani', 'mughlai', 'north-indian', 'american'], 'any', 2, ['smoky', 'rich', 'spicy']),
    searches: [{ query: 'biryani', daysAgo: 0.1 }, { query: 'kebab', daysAgo: 1.5, clickedSlug: 'kebab-kothi' }, { query: 'burger', daysAgo: 6 }],
    views: [{ slug: 'hosa-biryani-mane', daysAgo: 0.2 }, { slug: 'kebab-kothi', daysAgo: 1 }, { slug: 'smash-yard', daysAgo: 3 }, { slug: 'nagara-tandoor', daysAgo: 6 }],
    favourites: ['hosa-biryani-mane', 'kebab-kothi', 'smash-yard'] },
  { id: 3, fullName: 'Meera Iyer', email: 'meera@oota.demo',
    pref: pref(['cafe', 'italian', 'continental', 'desserts'], 'vegan', 0, ['fresh', 'creamy', 'sweet'], ['dairy']),
    searches: [{ query: 'vegan pizza', daysAgo: 0.15 }, { query: 'brunch', daysAgo: 2, clickedSlug: 'bean-atlas' }, { query: 'tiramisu', daysAgo: 4 }],
    views: [{ slug: 'greenhouse-5', daysAgo: 0.25 }, { slug: 'forno-verde', daysAgo: 1.2 }, { slug: 'sweet-shed', daysAgo: 3 }],
    favourites: ['greenhouse-5', 'forno-verde'] },
]

/** Other diners who wrote the seeded reviews. They cannot log in from the UI (no password shown) but exist as rows. */
export const reviewerNames = [
  'Karthik Rao', 'Priya Hegde', 'Sameer Khan', 'Deepa Gowda', 'Arjun Menon', 'Nisha Shetty', 'Vikram Iyer',
  'Farah Siddiqui', 'Rahul Nair', 'Shruti Kulkarni', 'Imran Pasha', 'Lakshmi Prasad', 'Aditya Bhat', 'Kavya Reddy',
  "Joel D'Souza", 'Tanvi Joshi', 'Manoj Kumar', 'Sneha Rao', 'Zoya Baig', 'Harsha Murthy',
]

export const DEMO_PASSWORD = 'demo1234'

export const allSeedUsers = [
  ...demoUserSpecs.map((u) => ({ id: u.id, fullName: u.fullName, email: u.email })),
  ...reviewerNames.map((n, i) => ({
    id: i + 4,
    fullName: n,
    email: `${n.toLowerCase().replace(/[^a-z]+/g, '.').replace(/\.$/, '')}@oota.demo`,
  })),
]

export const daysAgoIso = (d: number, now = Date.now()): string => new Date(now - d * 86_400_000).toISOString()

export type { SearchEntry, ViewEntry }
