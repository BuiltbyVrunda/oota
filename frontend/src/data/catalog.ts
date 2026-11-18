import type { Dish, Restaurant, Review } from '../types'

const round1 = (n: number) => Math.round(n * 10) / 10

/** Recompute cached averages from reviews — the same aggregate the backend runs in Mongo and writes to Postgres. */
export function applyRatings(restaurants: Restaurant[], dishes: Dish[], reviews: Review[]) {
  const rAgg = new Map<number, { sum: number; n: number }>()
  const dAgg = new Map<number, { sum: number; n: number }>()
  for (const rv of reviews) {
    const a = rAgg.get(rv.restaurantId) ?? { sum: 0, n: 0 }
    a.sum += rv.rating; a.n += 1
    rAgg.set(rv.restaurantId, a)
    for (const dr of rv.dishRatings) {
      const b = dAgg.get(dr.dishId) ?? { sum: 0, n: 0 }
      b.sum += dr.rating; b.n += 1
      dAgg.set(dr.dishId, b)
    }
  }
  return {
    restaurants: restaurants.map((r) => {
      const a = rAgg.get(r.id)
      return { ...r, avgRating: a ? round1(a.sum / a.n) : 0, reviewCount: a?.n ?? 0 }
    }),
    dishes: dishes.map((d) => {
      const b = dAgg.get(d.id)
      return { ...d, avgRating: b ? round1(b.sum / b.n) : 0, reviewCount: b?.n ?? 0 }
    }),
  }
}
