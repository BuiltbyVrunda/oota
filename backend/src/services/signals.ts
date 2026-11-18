/** A user's recommendation signals, all from MongoDB. */
import { col, type PrefDoc } from '../db/mongo.ts'
import type { Preferences, Review, SearchEntry, ViewEntry } from '../shared/types.ts'
import type { UserSignals } from '../shared/recommend.ts'

export const emptyPrefs: Preferences = { cuisineIds: [], diet: 'any', allergens: [], spiceLevel: 1, flavours: [], onboarded: false }

export function toPrefs(d: PrefDoc | null): Preferences {
  if (!d) return emptyPrefs
  return { cuisineIds: d.cuisineIds, diet: d.diet, allergens: d.allergens, spiceLevel: d.spiceLevel, flavours: d.flavours as Preferences['flavours'], onboarded: d.onboardedAt !== null }
}

export function toReview(d: { _id?: { toString(): string }; restaurantId: number; userId: number; userName: string; rating: Review['rating']; text: string; tags: string[]; dishRatings: Review['dishRatings']; createdAt: Date; updatedAt?: Date }): Review {
  return { id: String(d._id), restaurantId: d.restaurantId, userId: d.userId, userName: d.userName, rating: d.rating, text: d.text, tags: d.tags, dishRatings: d.dishRatings, createdAt: (d.updatedAt ?? d.createdAt).toISOString() }
}

export async function getSignals(userId: number): Promise<UserSignals> {
  const [p, s, r, v] = await Promise.all([
    col.prefs().findOne({ _id: userId }),
    col.searches().find({ userId }).sort({ createdAt: -1 }).limit(30).toArray(),
    col.reviews().find({ userId }).sort({ createdAt: -1 }).toArray(),
    col.views().find({ userId }).sort({ viewedAt: -1 }).limit(20).toArray(),
  ])
  const searches: SearchEntry[] = s.map((x) => ({ query: x.query, filters: x.filters, at: x.createdAt.toISOString(), ...(x.clickedRestaurantId ? { clickedRestaurantId: x.clickedRestaurantId } : {}) }))
  const views: ViewEntry[] = v.map((x) => ({ restaurantId: x.restaurantId, at: x.viewedAt.toISOString() }))
  return { prefs: toPrefs(p), searches, reviews: r.map(toReview), views }
}
