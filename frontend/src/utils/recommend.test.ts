import { describe, expect, it } from 'vitest'
import type { Preferences, Review } from '../types'
import { buildSeed } from './seed'
import { buildDashboard, decayWeight, dietAllows, quantize, rankDishes, rankRestaurants, type UserSignals } from './recommend'
import { defaultFilters, discover } from './filter'

const NOW = Date.UTC(2026, 10, 18, 12)
const seed = buildSeed(NOW)
const cat = { cuisines: seed.cuisines, restaurants: seed.restaurants, dishes: seed.dishes }
const emptyPrefs: Preferences = { cuisineIds: [], diet: 'any', allergens: [], spiceLevel: 1, flavours: [], onboarded: true }
const signalsFor = (userId: number): UserSignals => {
  const d = seed.demo.find((x) => x.userId === userId)!
  return { prefs: d.preferences, searches: d.searches, views: d.views, reviews: seed.reviews.filter((r) => r.userId === userId) }
}

describe('seed data', () => {
  it('has the volumes from CLAUDE.md §7', () => {
    expect(cat.cuisines).toHaveLength(18)
    expect(cat.restaurants).toHaveLength(24)
    expect(cat.dishes.length).toBeGreaterThanOrEqual(200)
    expect(seed.reviews.length).toBeGreaterThanOrEqual(140)
  })
  it('restaurant averages spread roughly 3.7–4.7', () => {
    const avgs = cat.restaurants.map((r) => r.avgRating)
    expect(Math.min(...avgs)).toBeGreaterThanOrEqual(3.4)
    expect(Math.max(...avgs)).toBeLessThanOrEqual(4.8)
    expect(Math.max(...avgs) - Math.min(...avgs)).toBeGreaterThanOrEqual(0.7)
  })
})

describe('hard filters', () => {
  it('diet rules', () => {
    expect(dietAllows('veg', 'vegan')).toBe(true)
    expect(dietAllows('veg', 'egg')).toBe(false)
    expect(dietAllows('egg', 'egg')).toBe(true)
    expect(dietAllows('vegan', 'veg')).toBe(false)
  })
  it('a vegan user never gets non-vegan dishes or meat-only places', () => {
    const sig = signalsFor(3)
    expect(rankDishes(cat, sig, NOW).every((d) => d.item.diet === 'vegan')).toBe(true)
    const ids = rankRestaurants(cat, sig, NOW).map((r) => r.item.slug)
    expect(ids).not.toContain('kebab-kothi')
  })
  it('allergens exclude dishes', () => {
    const sig: UserSignals = { prefs: { ...emptyPrefs, allergens: ['nuts'] }, searches: [], reviews: [], views: [] }
    expect(rankDishes(cat, sig, NOW).some((d) => d.item.allergens.includes('nuts'))).toBe(false)
  })
})

describe('signals', () => {
  it('cold start falls back to quality + trending', () => {
    const sig: UserSignals = { prefs: { ...emptyPrefs, spiceLevel: 0 }, searches: [], reviews: [], views: [] }
    const top = rankRestaurants(cat, sig, NOW)[0]
    expect(top.reasons).toContain('Trending this week')
  })
  it('search weight halves every 7 days', () => {
    const at = new Date(NOW - 7 * 86_400_000).toISOString()
    expect(decayWeight(at, NOW)).toBeCloseTo(0.5, 5)
    expect(decayWeight(new Date(NOW).toISOString(), NOW)).toBeCloseTo(1, 5)
  })
  it('a fresh search outranks an old one', () => {
    const base: UserSignals = { prefs: emptyPrefs, reviews: [], views: [], searches: [] }
    const fresh = rankRestaurants(cat, { ...base, searches: [{ query: 'momos', filters: {}, at: new Date(NOW).toISOString() }] }, NOW)
    const stale = rankRestaurants(cat, { ...base, searches: [{ query: 'momos', filters: {}, at: new Date(NOW - 60 * 86_400_000).toISOString() }] }, NOW)
    const f = fresh.find((r) => r.item.slug === 'momo-mandala')!
    const s = stale.find((r) => r.item.slug === 'momo-mandala')!
    expect(f.score).toBeGreaterThan(s.score)
    expect(f.reasons[0]).toBe('You searched “momos”')
  })
  it('a 5★ rating boosts and a 1★ rating penalises', () => {
    const mk = (rating: 1 | 5): Review => ({ id: 'x', restaurantId: 15, userId: 99, userName: 'T', rating, text: 'test review', tags: [], dishRatings: [], createdAt: new Date(NOW).toISOString() })
    const base: UserSignals = { prefs: { ...emptyPrefs, flavours: ['fresh'] }, searches: [], views: [], reviews: [] }
    const none = rankRestaurants(cat, base, NOW).find((r) => r.item.id === 15)!
    const up = rankRestaurants(cat, { ...base, reviews: [mk(5)] }, NOW).find((r) => r.item.id === 15)!
    const down = rankRestaurants(cat, { ...base, reviews: [mk(1)] }, NOW).find((r) => r.item.id === 15)!
    expect(up.score).toBeGreaterThan(none.score)
    expect(down.score).toBeLessThan(none.score)
    expect(up.reasons).toContain('You rated this place 5★')
  })
  it('reasons are plain words, max two', () => {
    for (const r of rankRestaurants(cat, signalsFor(1), NOW)) {
      expect(r.reasons.length).toBeGreaterThan(0)
      expect(r.reasons.length).toBeLessThanOrEqual(2)
    }
  })
  it('quantize is monotonic', () => {
    expect(quantize(0.9)).toBe(5)
    expect(quantize(0.1)).toBe(1)
  })
})

describe('personalisation', () => {
  it('the three demo users get different top-5 restaurants', () => {
    const top5 = [1, 2, 3].map((id) => buildDashboard(cat, signalsFor(id), NOW).top.items.slice(0, 5).map((r) => r.item.slug))
    console.log(top5)
    expect(top5[0]).not.toEqual(top5[1])
    expect(top5[1]).not.toEqual(top5[2])
    expect(top5[0]).not.toEqual(top5[2])
    const overlap = (a: string[], b: string[]) => a.filter((x) => b.includes(x)).length
    expect(overlap(top5[0], top5[1])).toBeLessThanOrEqual(1)
    expect(overlap(top5[1], top5[2])).toBeLessThanOrEqual(1)
  })
  it('dashboard search tier follows the latest search', () => {
    const d = buildDashboard(cat, signalsFor(2), NOW)
    expect(d.searched.query).toBe('biryani')
    expect(d.searched.items[0].item.slug).toBe('hosa-biryani-mane')
  })
})

describe('discover', () => {
  it('filters by cuisine, diet, price and rating together', () => {
    const r = discover(cat, signalsFor(1), '', { ...defaultFilters, cuisineIds: [1], diet: 'veg', priceLevels: [1], minRating: 4 }, NOW)
    expect(r.restaurants.length).toBeGreaterThan(0)
    expect(r.restaurants.every((x) => x.item.priceLevel === 1 && x.item.avgRating >= 4)).toBe(true)
  })
  it('text search finds dishes', () => {
    const r = discover(cat, signalsFor(1), 'ghee roast', defaultFilters, NOW)
    expect(r.dishes.map((d) => d.item.name)).toContain('Ghee Roast Dosa')
  })
})
