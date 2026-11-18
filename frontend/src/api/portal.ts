import type { Dish, Restaurant, Review } from '../types'
import { api } from './client'
import type { NewDish } from './endpoints'

export type PortalRole = 'partner' | 'admin'
export interface PortalUser { id: number; fullName: string; email: string; restaurantId?: number; restaurantName?: string; restaurantSlug?: string; restaurantStatus?: 'pending' | 'approved' | 'rejected' }
export interface ManagedDish extends Dish { isAvailable: boolean; createdAt: string; timesOrdered: number; restaurantName: string }
export type DishInput = Omit<NewDish, 'restaurantId'> & { isAvailable?: boolean }
/** a patch may clear the photo with imageUrl: null */
export type DishPatch = Partial<Omit<DishInput, 'imageUrl'>> & { imageUrl?: string | null }
export interface RatingStats { avg: number; count: number; r1: number; r2: number; r3: number; r4: number; r5: number }
export interface PartnerOverview {
  restaurant: Restaurant
  stats: { dishes: number; available: number; sections: number; saves: number; orders30: number; revenue30: number; unitsSold: number }
  ratings: RatingStats
}
export interface PortalOrder { id: number; customer: string; status: string; total: number; placedAt: string; items: { name: string; quantity: number }[] }
export interface AdminRestaurant {
  id: number; slug: string; name: string; area: string; costForTwo: number; priceLevel: number; isPureVeg: boolean; avgRating: number; reviewCount: number
  status: 'pending' | 'approved' | 'rejected'; createdAt: string
  coverUrl: string; opensAt: string; closesAt: string; trendingScore: number; ownerEmail: string | null; ownerName: string | null; dishes: number; cuisines: string[]
}
export interface AdminUser { id: number; fullName: string; email: string; createdAt: string; saves: number; orders: number; reviews: number }
export interface AdminReview extends Review { restaurantName: string }
export interface NewRestaurant {
  name: string; description: string; area: string; address: string; costForTwo: number; isPureVeg: boolean; opensAt: string; closesAt: string
  cuisineIds: number[]; coverUrl: string; ownerName: string; ownerEmail: string; ownerPassword: string
}

export const portalAuth = {
  me: (role: PortalRole) => api.get<{ user: PortalUser | null }>(`/${role}/auth/me`),
  login: (role: PortalRole, email: string, password: string) => api.post<{ user: PortalUser }>(`/${role}/auth/login`, { email, password }),
  logout: (role: PortalRole) => api.post<void>(`/${role}/auth/logout`),
}

export const partnerApi = {
  overview: () => api.get<PartnerOverview>('/partner/overview'),
  menu: () => api.get<ManagedDish[]>('/partner/menu'),
  addDish: (d: DishInput) => api.post<Dish>('/partner/dishes', d),
  updateDish: (id: number, d: DishPatch) => api.req<ManagedDish>('PATCH', `/partner/dishes/${id}`, d),
  deleteDish: (id: number) => api.del<void>(`/partner/dishes/${id}`),
  reviews: () => api.get<Review[]>('/partner/reviews'),
  orders: () => api.get<PortalOrder[]>('/partner/orders'),
  setOrderStatus: (id: number, status: 'PREPARING' | 'DELIVERED' | 'CANCELLED') => api.req<{ ok: true }>('PATCH', `/partner/orders/${id}`, { status }),
}

export const adminApi = {
  overview: () => api.get<Record<string, number>>('/admin/overview'),
  restaurants: () => api.get<AdminRestaurant[]>('/admin/restaurants'),
  createRestaurant: (r: NewRestaurant) => api.post<{ id: number; slug: string }>('/admin/restaurants', r),
  updateRestaurant: (id: number, p: Partial<Pick<AdminRestaurant, 'name' | 'area' | 'costForTwo' | 'isPureVeg' | 'opensAt' | 'closesAt' | 'trendingScore' | 'status'>>) =>
    api.req<{ ok: true }>('PATCH', `/admin/restaurants/${id}`, p),
  deleteRestaurant: (id: number) => api.del<{ deleted: string }>(`/admin/restaurants/${id}`),
  dishes: (q: string) => api.get<ManagedDish[]>(`/admin/dishes?q=${encodeURIComponent(q)}`),
  updateDish: (id: number, d: DishPatch) => api.req<ManagedDish>('PATCH', `/admin/dishes/${id}`, d),
  deleteDish: (id: number) => api.del<void>(`/admin/dishes/${id}`),
  users: () => api.get<AdminUser[]>('/admin/users'),
  deleteUser: (id: number) => api.del<{ ok: true }>(`/admin/users/${id}`),
  reviews: () => api.get<AdminReview[]>('/admin/reviews'),
  deleteReview: (id: string) => api.del<{ restaurant: { avgRating: number } }>(`/admin/reviews/${id}`),
}
