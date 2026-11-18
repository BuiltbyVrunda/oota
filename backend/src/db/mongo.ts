import { MongoClient, type Collection, type ObjectId } from 'mongodb'
import { env } from '../config/env.ts'

export interface PrefDoc { _id: number; cuisineIds: number[]; diet: 'any' | 'veg' | 'egg' | 'vegan'; allergens: string[]; spiceLevel: 0 | 1 | 2 | 3; flavours: string[]; budget?: { min: number; max: number }; onboardedAt: Date | null; updatedAt: Date }
export interface ReviewDoc { _id?: ObjectId; restaurantId: number; userId: number; userName: string; rating: 1 | 2 | 3 | 4 | 5; text: string; tags: string[]; dishRatings: { dishId: number; rating: 1 | 2 | 3 | 4 | 5 }[]; visitedOn?: Date; createdAt: Date; updatedAt: Date }
export interface SearchDoc { _id?: ObjectId; userId: number; query: string; filters: Record<string, unknown>; resultCount?: number; clickedRestaurantId?: number; createdAt: Date }
export interface ViewDoc { _id?: ObjectId; userId: number; restaurantId: number; viewedAt: Date }

export const mongo = new MongoClient(env.MONGO_URL, { serverSelectionTimeoutMS: 4000 })
export const mdb = () => mongo.db(env.MONGO_DB)

export const col = {
  prefs: (): Collection<PrefDoc> => mdb().collection<PrefDoc>('user_preferences'),
  reviews: (): Collection<ReviewDoc> => mdb().collection<ReviewDoc>('reviews'),
  searches: (): Collection<SearchDoc> => mdb().collection<SearchDoc>('search_history'),
  views: (): Collection<ViewDoc> => mdb().collection<ViewDoc>('restaurant_views'),
}
