import type { Cuisine, DashboardData, Dish, Filters, Preferences, Recommendation, Restaurant, Review, SearchEntry, User, ViewEntry } from '../types'
import { api } from './client'

export interface Catalog { cuisines: Cuisine[]; restaurants: Restaurant[]; dishes: Dish[] }
export interface Order { id: number; restaurantId: number; restaurantName?: string; status: string; total: number; placedAt: string; items?: { dishId: number; name: string; quantity: number; unitPrice: number }[] }
export interface SystemStatus {
  postgres: string; mongo: string
  tables: { name: string; rows: number; missing: boolean }[]
  views: { name: string; rows: number; missing: boolean }[]
  collections: { name: string; docs: number }[]
  events: { source: 'postgres' | 'mongo'; table: string; op: string; at: string }[]
}
export type ReviewBody = Pick<Review, 'rating' | 'text' | 'tags' | 'dishRatings'>
export interface NewDish {
  restaurantId: number; category: string; name: string; description: string; price: number
  diet: Dish['diet']; spiceLevel: Dish['spiceLevel']; flavourTags: Dish['flavourTags']; allergens: string[]; imageUrl?: string
}

const qs = (q: string, f: Filters) => {
  const p = new URLSearchParams()
  if (q.trim()) p.set('q', q.trim())
  if (f.cuisineIds.length) p.set('cuisine', f.cuisineIds.join(','))
  if (f.diet !== 'any') p.set('diet', f.diet)
  if (f.priceLevels.length) p.set('price', f.priceLevels.join(','))
  if (f.minRating) p.set('minRating', String(f.minRating))
  if (f.flavours.length) p.set('flavour', f.flavours.join(','))
  p.set('sort', f.sort)
  return p.toString()
}

export const endpoints = {
  me: () => api.get<{ user: User | null }>('/auth/me'),
  login: (email: string, password: string) => api.post<{ user: User }>('/auth/login', { email, password }),
  signup: (fullName: string, email: string, password: string) => api.post<{ user: User }>('/auth/signup', { fullName, email, password }),
  logout: () => api.post<void>('/auth/logout'),

  catalog: () => api.get<Catalog>('/catalog'),
  restaurants: (q: string, f: Filters) => api.get<Recommendation<Restaurant>[]>(`/restaurants?${qs(q, f)}`),
  dishes: (q: string, f: Filters) => api.get<Recommendation<Dish>[]>(`/dishes?${qs(q, f)}`),

  recommendations: () => api.get<DashboardData>('/me/recommendations'),
  preferences: () => api.get<Preferences>('/me/preferences'),
  savePreferences: (p: Preferences) => api.put<Preferences>('/me/preferences', p),

  favourites: () => api.get<number[]>('/me/favourites'),
  addFavourite: (id: number) => api.put<void>(`/me/favourites/${id}`),
  removeFavourite: (id: number) => api.del<void>(`/me/favourites/${id}`),

  searches: () => api.get<SearchEntry[]>('/me/searches?limit=30'),
  recordSearch: (e: Omit<SearchEntry, 'at'> & { resultCount?: number }) => api.post('/me/searches', e),
  clearSearches: () => api.del<void>('/me/searches'),
  views: () => api.get<ViewEntry[]>('/me/views'),
  recordView: (restaurantId: number) => api.post('/me/views', { restaurantId }),

  reviewsFor: (restaurantId: number) => api.get<Review[]>(`/restaurants/${restaurantId}/reviews`),
  myReviews: () => api.get<Review[]>('/me/reviews'),
  upsertReview: (restaurantId: number, b: ReviewBody) =>
    api.post<{ review: Review; restaurant: { avgRating: number; reviewCount: number } }>(`/restaurants/${restaurantId}/reviews`, b),
  deleteReview: (restaurantId: number) => api.del<{ restaurant: { avgRating: number; reviewCount: number } }>(`/restaurants/${restaurantId}/reviews/mine`),

  placeOrder: (restaurantId: number, items: { dishId: number; quantity: number }[]) => api.post<Order>('/orders', { restaurantId, items }),
  myOrders: () => api.get<Order[]>('/me/orders'),

  addDish: (d: NewDish) => api.post<Dish>('/dishes', d),

  status: () => api.get<SystemStatus>('/system/status'),
}
