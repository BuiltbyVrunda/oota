/** Assembles the full Phase-1 mock world. Also used by `npm run export:seed` to write db/seed/*.json. */
import { applyRatings } from '../data/catalog'
import { cuisines } from '../data/cuisines'
import { baseDishes } from '../data/dishes'
import { baseRestaurants } from '../data/restaurants'
import { buildSeedReviews } from '../data/reviews'
import { allSeedUsers, daysAgoIso, demoUserSpecs } from '../data/users'
import type { Preferences, SearchEntry, ViewEntry } from '../types'

export function buildSeed(now = Date.now()) {
  const reviews = buildSeedReviews(now)
  const { restaurants, dishes } = applyRatings(baseRestaurants, baseDishes, reviews)
  const idOf = (slug: string) => {
    const r = baseRestaurants.find((x) => x.slug === slug)
    if (!r) throw new Error(`Unknown slug ${slug}`)
    return r.id
  }
  const demo = demoUserSpecs.map((u) => {
    const preferences: Preferences = {
      cuisineIds: u.pref.cuisineSlugs.map((s) => cuisines.find((c) => c.slug === s)!.id),
      diet: u.pref.diet, allergens: u.pref.allergens, spiceLevel: u.pref.spiceLevel, flavours: u.pref.flavours, onboarded: true,
    }
    const searches: SearchEntry[] = u.searches.map((s) => ({
      query: s.query, filters: {}, at: daysAgoIso(s.daysAgo, now),
      ...('clickedSlug' in s && s.clickedSlug ? { clickedRestaurantId: idOf(s.clickedSlug) } : {}),
    }))
    const views: ViewEntry[] = u.views.map((v) => ({ restaurantId: idOf(v.slug), at: daysAgoIso(v.daysAgo, now) }))
    return { userId: u.id, preferences, searches, views, favourites: u.favourites.map(idOf) }
  })
  return { cuisines, restaurants, dishes, reviews, users: allSeedUsers, demo }
}
