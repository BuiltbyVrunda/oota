export type Diet = 'veg' | 'egg' | 'nonveg' | 'vegan'
export type DietPref = 'any' | 'veg' | 'egg' | 'vegan' // veg pref sees veg+vegan; egg sees veg+egg+vegan; vegan sees vegan only
export type Flavour = 'spicy' | 'tangy' | 'sweet' | 'creamy' | 'smoky' | 'mild' | 'rich' | 'fresh' | 'crispy' | 'comforting'

export interface Cuisine { id: number; slug: string; name: string; imageUrl: string }

export interface Restaurant {
  id: number; slug: string; name: string; description: string; area: string; address: string
  priceLevel: 1 | 2 | 3 | 4; costForTwo: number; isPureVeg: boolean; opensAt: string; closesAt: string
  coverUrl: string; galleryUrls: string[]; cuisineIds: number[]; avgRating: number; reviewCount: number; trendingScore: number
}

export interface Dish {
  id: number; restaurantId: number; category: string; cuisineId: number; name: string; description: string
  price: number; diet: Diet; spiceLevel: 0 | 1 | 2 | 3; flavourTags: Flavour[]; allergens: string[]; imageUrl: string
  avgRating: number; reviewCount: number
}

export interface Review {
  id: string; restaurantId: number; userId: number; userName: string; rating: 1 | 2 | 3 | 4 | 5; text: string
  tags: string[]; dishRatings: { dishId: number; rating: 1 | 2 | 3 | 4 | 5 }[]; createdAt: string
}

export interface Preferences {
  cuisineIds: number[]; diet: DietPref; allergens: string[]; spiceLevel: 0 | 1 | 2 | 3; flavours: Flavour[]; onboarded: boolean
}

export interface SearchEntry { query: string; filters: Partial<Filters>; at: string; clickedRestaurantId?: number }

export interface Filters {
  cuisineIds: number[]; diet: DietPref | 'nonveg'; priceLevels: number[]; minRating: number; flavours: Flavour[]
  sort: 'match' | 'rating' | 'price'
}

export interface Recommendation<T> { item: T; score: number; match: 1 | 2 | 3 | 4 | 5; reasons: string[] } // reasons e.g. "You rated Andhra food 5★"

/* ---- additions used by the UI (not in the CLAUDE.md contract, documented here) ---- */

export interface User { id: number; fullName: string; email: string }

export interface ViewEntry { restaurantId: number; at: string }

/** A signal shown in the reason-plate popover: what fed a tier. */
export interface Signal { label: string; detail: string }

export type TierKey = 'searched' | 'top' | 'trending' | 'recent' | 'cuisines'

export interface Tier<T = Restaurant | Dish> {
  key: TierKey; title: string; reason: string; signals: Signal[]; items: Recommendation<T>[]
}

export interface DashboardData {
  searched: Tier<Restaurant> & { query: string | null; dishes: Recommendation<Dish>[] }
  top: Tier<Restaurant>
  trending: Tier<Restaurant> & { dishes: Recommendation<Dish>[] }
  recent: Tier<Restaurant>
  cuisines: { key: 'cuisines'; title: string; reason: string; signals: Signal[]; items: Cuisine[] }
  fact: string
}
