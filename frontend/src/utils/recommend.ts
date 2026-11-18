/**
 * Oota recommender — pure and deterministic. Same contract is ported to backend/src/services/recommender.ts.
 *
 * score = 0.30·cuisineAffinity + 0.25·searchAffinity + 0.20·ratingSignal + 0.15·tasteFit + 0.10·qualityPrior
 * Hard filters (diet, allergens) run first. Cold start (no signals) → quality + trending.
 */
import type {
  Cuisine, DashboardData, Diet, DietPref, Dish, Preferences, Recommendation, Restaurant, Review, SearchEntry, Signal, ViewEntry,
} from '../types'

export const WEIGHTS = { cuisine: 0.3, search: 0.25, rating: 0.2, taste: 0.15, quality: 0.1 } as const
const HALF_LIFE_DAYS = 7
const DAY = 86_400_000

export interface Catalog { cuisines: Cuisine[]; restaurants: Restaurant[]; dishes: Dish[] }
export interface UserSignals {
  prefs: Preferences
  searches: SearchEntry[] // any order
  reviews: Review[] // this user's own reviews
  views: ViewEntry[]
}

/* ------------------------------------------------------------------ hard filters */

export function dietAllows(pref: DietPref | 'nonveg', diet: Diet): boolean {
  switch (pref) {
    case 'any': return true
    case 'veg': return diet === 'veg' || diet === 'vegan'
    case 'egg': return diet !== 'nonveg'
    case 'vegan': return diet === 'vegan'
    case 'nonveg': return diet === 'nonveg'
  }
}

export const dishAllowed = (d: Dish, p: Pick<Preferences, 'diet' | 'allergens'>): boolean =>
  dietAllows(p.diet, d.diet) && !d.allergens.some((a) => p.allergens.includes(a))

/** A restaurant is eligible when it has at least 3 dishes the user can eat (or all its dishes, for tiny menus). */
export function restaurantEligible(r: Restaurant, dishes: Dish[], p: Pick<Preferences, 'diet' | 'allergens'>): boolean {
  if (p.diet === 'any' && p.allergens.length === 0) return true
  const menu = dishes.filter((d) => d.restaurantId === r.id)
  const ok = menu.filter((d) => dishAllowed(d, p)).length
  return ok >= Math.min(3, menu.length) && ok > 0
}

/* ------------------------------------------------------------------ helpers */

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n))
const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N} ]+/gu, ' ').replace(/\s+/g, ' ').trim()
export const tokens = (s: string): string[] => norm(s).split(' ').filter((t) => t.length > 1)

export function decayWeight(atIso: string, now: number): number {
  const ageDays = Math.max(0, (now - new Date(atIso).getTime()) / DAY)
  return Math.pow(0.5, ageDays / HALF_LIFE_DAYS)
}

/** Does the query text match this haystack? All query tokens must appear as a prefix of some word. */
export function textMatches(query: string, haystack: string): boolean {
  const q = tokens(query)
  if (q.length === 0) return false
  const words = tokens(haystack)
  return q.every((t) => words.some((w) => w.startsWith(t) || (t.length > 3 && w.includes(t))))
}

const recentSearches = (s: SearchEntry[]) => [...s].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 30)

export function bayesian(avg: number, n: number, globalMean = 4.0, C = 5): number {
  return (C * globalMean + avg * n) / (C + n)
}

export function quantize(score: number): 1 | 2 | 3 | 4 | 5 {
  if (score >= 0.62) return 5
  if (score >= 0.48) return 4
  if (score >= 0.34) return 3
  if (score >= 0.2) return 2
  return 1
}

export const matchWord = (m: number): string => (m >= 4 ? 'Strong match' : m === 3 ? 'Good match' : 'Fair match')

const hasSignals = (s: UserSignals) => s.prefs.cuisineIds.length > 0 || s.searches.length > 0 || s.reviews.length > 0 || s.prefs.flavours.length > 0

/* ------------------------------------------------------------------ indexes */

interface Ctx {
  cat: Catalog
  sig: UserSignals
  now: number
  cuisineName: Map<number, string>
  dishesByRestaurant: Map<number, Dish[]>
  restaurantById: Map<number, Restaurant>
  dishById: Map<number, Dish>
  /** learned cuisine affinity from own ratings: cuisineId → {avg, n} */
  ratedCuisine: Map<number, { sum: number; n: number }>
  searchList: SearchEntry[]
  globalMean: number
}

export function buildCtx(cat: Catalog, sig: UserSignals, now: number): Ctx {
  const dishesByRestaurant = new Map<number, Dish[]>()
  for (const d of cat.dishes) {
    const arr = dishesByRestaurant.get(d.restaurantId) ?? []
    arr.push(d)
    dishesByRestaurant.set(d.restaurantId, arr)
  }
  const restaurantById = new Map(cat.restaurants.map((r) => [r.id, r]))
  const ratedCuisine = new Map<number, { sum: number; n: number }>()
  for (const rv of sig.reviews) {
    const r = restaurantById.get(rv.restaurantId)
    if (!r) continue
    for (const cid of r.cuisineIds) {
      const a = ratedCuisine.get(cid) ?? { sum: 0, n: 0 }
      a.sum += rv.rating; a.n += 1
      ratedCuisine.set(cid, a)
    }
  }
  const rated = cat.restaurants.filter((r) => r.reviewCount > 0)
  const globalMean = rated.length ? rated.reduce((s, r) => s + r.avgRating, 0) / rated.length : 4
  return {
    cat, sig, now, dishesByRestaurant, restaurantById, ratedCuisine, globalMean,
    cuisineName: new Map(cat.cuisines.map((c) => [c.id, c.name])),
    dishById: new Map(cat.dishes.map((d) => [d.id, d])),
    searchList: recentSearches(sig.searches),
  }
}

/* ------------------------------------------------------------------ signals */

interface Part { value: number; reason: string | null }

function cuisineAffinity(ctx: Ctx, cuisineIds: number[]): Part {
  const declared = cuisineIds.find((c) => ctx.sig.prefs.cuisineIds.includes(c))
  if (declared !== undefined) return { value: 1, reason: `You picked ${ctx.cuisineName.get(declared)}` }
  let best = 0
  let bestReason: string | null = null
  for (const cid of cuisineIds) {
    const a = ctx.ratedCuisine.get(cid)
    if (!a) continue
    const avg = a.sum / a.n
    const v = clamp((avg - 3) / 2)
    if (v > best) {
      best = v
      bestReason = `You rated ${ctx.cuisineName.get(cid)} food ${Math.round(avg)}★`
    }
  }
  return { value: best, reason: bestReason }
}

function restaurantHaystack(ctx: Ctx, r: Restaurant): string {
  const menu = ctx.dishesByRestaurant.get(r.id) ?? []
  return [r.name, r.area, ...r.cuisineIds.map((c) => ctx.cuisineName.get(c) ?? ''), ...menu.map((d) => `${d.name} ${d.category}`)].join(' ')
}
const dishHaystack = (ctx: Ctx, d: Dish) =>
  [d.name, d.description, d.category, ctx.cuisineName.get(d.cuisineId) ?? '', ctx.restaurantById.get(d.restaurantId)?.name ?? ''].join(' ')

function searchAffinity(ctx: Ctx, haystack: string, clickedId?: number): Part {
  let sum = 0
  let top: { w: number; q: string } | null = null
  for (const s of ctx.searchList) {
    const hit = textMatches(s.query, haystack) || (clickedId !== undefined && s.clickedRestaurantId === clickedId)
    if (!hit) continue
    const w = decayWeight(s.at, ctx.now)
    sum += w
    if (!top || w > top.w) top = { w, q: s.query }
  }
  return { value: clamp(sum), reason: top ? `You searched “${top.q}”` : null }
}

function ratingSignalRestaurant(ctx: Ctx, r: Restaurant): Part {
  const own = ctx.sig.reviews.find((rv) => rv.restaurantId === r.id)
  if (own) {
    const v = (own.rating - 3) / 2
    return { value: v, reason: v > 0 ? `You rated this place ${own.rating}★` : null }
  }
  // same cuisine
  let best: Part = { value: 0, reason: null }
  for (const cid of r.cuisineIds) {
    const a = ctx.ratedCuisine.get(cid)
    if (!a) continue
    const avg = a.sum / a.n
    const v = ((avg - 3) / 2) * 0.8
    if (Math.abs(v) > Math.abs(best.value)) best = { value: v, reason: v > 0 ? `You rated ${ctx.cuisineName.get(cid)} food ${Math.round(avg)}★` : null }
  }
  return best
}

function ratingSignalDish(ctx: Ctx, d: Dish): Part {
  for (const rv of ctx.sig.reviews) {
    const dr = rv.dishRatings.find((x) => x.dishId === d.id)
    if (dr) {
      const v = (dr.rating - 3) / 2
      return { value: v, reason: v > 0 ? `You rated it ${dr.rating}★` : null }
    }
  }
  // dishes you rated that share flavour tags
  let sum = 0
  let n = 0
  let liked: string | null = null
  for (const rv of ctx.sig.reviews) {
    for (const dr of rv.dishRatings) {
      const other = ctx.dishById.get(dr.dishId)
      if (!other || other.id === d.id) continue
      const shared = other.flavourTags.filter((t) => d.flavourTags.includes(t)).length
      if (shared >= 2) {
        sum += (dr.rating - 3) / 2
        n++
        if (dr.rating >= 4 && !liked) liked = other.name
      }
    }
  }
  const r = ratingSignalRestaurant(ctx, ctx.restaurantById.get(d.restaurantId)!)
  const tagV = n ? (sum / n) * 0.7 : 0
  if (Math.abs(tagV) >= Math.abs(r.value * 0.6)) return { value: tagV, reason: tagV > 0 && liked ? `Like ${liked}, which you rated highly` : null }
  return { value: r.value * 0.6, reason: r.reason }
}

function tasteFitDish(ctx: Ctx, d: Dish): Part {
  const p = ctx.sig.prefs
  const spice = 1 - Math.abs(d.spiceLevel - p.spiceLevel) / 3
  const overlap = d.flavourTags.filter((f) => p.flavours.includes(f))
  const flav = p.flavours.length ? overlap.length / Math.min(p.flavours.length, Math.max(1, d.flavourTags.length)) : 0
  const value = clamp(0.4 * spice + 0.6 * clamp(flav))
  return { value, reason: overlap.length ? `Matches your ${overlap.slice(0, 2).join(' + ')} taste` : null }
}

function tasteFitRestaurant(ctx: Ctx, r: Restaurant): Part {
  const menu = (ctx.dishesByRestaurant.get(r.id) ?? []).filter((d) => dishAllowed(d, ctx.sig.prefs))
  if (!menu.length) return { value: 0, reason: null }
  const fits = menu.map((d) => tasteFitDish(ctx, d)).sort((a, b) => b.value - a.value).slice(0, 3)
  return { value: fits.reduce((s, f) => s + f.value, 0) / fits.length, reason: fits.find((f) => f.reason)?.reason ?? null }
}

function qualityPrior(ctx: Ctx, avg: number, n: number): Part {
  const b = bayesian(avg, n, ctx.globalMean)
  return { value: clamp((b - 3) / 2), reason: n > 0 ? `Rated ${avg.toFixed(1)} by ${n} ${n === 1 ? 'diner' : 'diners'}` : null }
}

function combine(parts: Record<keyof typeof WEIGHTS, Part>, coldStart: boolean, trending: number): { score: number; reasons: string[] } {
  if (coldStart) {
    const score = clamp(0.6 * parts.quality.value + 0.4 * (trending / 100))
    return { score, reasons: [parts.quality.reason ?? 'Popular in Bengaluru', 'Trending this week'] }
  }
  const contribs = (Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]).map((k) => ({ k, c: WEIGHTS[k] * parts[k].value, reason: parts[k].reason }))
  const score = clamp(contribs.reduce((s, x) => s + x.c, 0))
  const reasons = contribs
    .filter((x) => x.c > 0 && x.reason)
    .sort((a, b) => b.c - a.c)
    .slice(0, 2)
    .map((x) => x.reason as string)
  if (reasons.length === 0) reasons.push(parts.quality.reason ?? 'Popular in Bengaluru')
  return { score, reasons }
}

/* ------------------------------------------------------------------ public scoring */

export function scoreRestaurant(ctx: Ctx, r: Restaurant): Recommendation<Restaurant> {
  const parts = {
    cuisine: cuisineAffinity(ctx, r.cuisineIds),
    search: searchAffinity(ctx, restaurantHaystack(ctx, r), r.id),
    rating: ratingSignalRestaurant(ctx, r),
    taste: tasteFitRestaurant(ctx, r),
    quality: qualityPrior(ctx, r.avgRating, r.reviewCount),
  }
  const { score, reasons } = combine(parts, !hasSignals(ctx.sig), r.trendingScore)
  return { item: r, score: Math.round(score * 1000) / 1000, match: quantize(score), reasons }
}

export function scoreDish(ctx: Ctx, d: Dish): Recommendation<Dish> {
  const r = ctx.restaurantById.get(d.restaurantId)
  const parts = {
    cuisine: cuisineAffinity(ctx, [d.cuisineId]),
    search: searchAffinity(ctx, dishHaystack(ctx, d)),
    rating: ratingSignalDish(ctx, d),
    taste: tasteFitDish(ctx, d),
    quality: qualityPrior(ctx, d.avgRating, d.reviewCount),
  }
  const { score, reasons } = combine(parts, !hasSignals(ctx.sig), r?.trendingScore ?? 50)
  return { item: d, score: Math.round(score * 1000) / 1000, match: quantize(score), reasons }
}

const byScore = <T extends { id: number }>(a: Recommendation<T>, b: Recommendation<T>) => b.score - a.score || a.item.id - b.item.id

export function rankRestaurants(cat: Catalog, sig: UserSignals, now: number, pool?: Restaurant[]): Recommendation<Restaurant>[] {
  const ctx = buildCtx(cat, sig, now)
  return (pool ?? cat.restaurants)
    .filter((r) => restaurantEligible(r, cat.dishes, sig.prefs))
    .map((r) => scoreRestaurant(ctx, r))
    .sort(byScore)
}

export function rankDishes(cat: Catalog, sig: UserSignals, now: number, pool?: Dish[]): Recommendation<Dish>[] {
  const ctx = buildCtx(cat, sig, now)
  return (pool ?? cat.dishes)
    .filter((d) => dishAllowed(d, sig.prefs))
    .map((d) => scoreDish(ctx, d))
    .sort(byScore)
}

/* ------------------------------------------------------------------ dashboard */

export function buildDashboard(cat: Catalog, sig: UserSignals, now: number): DashboardData {
  const ctx = buildCtx(cat, sig, now)
  const eligible = cat.restaurants.filter((r) => restaurantEligible(r, cat.dishes, sig.prefs))
  const scored = eligible.map((r) => scoreRestaurant(ctx, r)).sort(byScore)
  const scoreOf = new Map(scored.map((s) => [s.item.id, s]))
  const allowedDishes = cat.dishes.filter((d) => dishAllowed(d, sig.prefs))
  const prefSignals = prefsAsSignals(ctx)

  // 1. Because you searched X
  const last = ctx.searchList[0]
  let searched: DashboardData['searched']
  if (last) {
    const relevance = (r: Restaurant) =>
      textMatches(last.query, [r.name, ...r.cuisineIds.map((c) => ctx.cuisineName.get(c) ?? '')].join(' ')) ? 1 : 0
    const items = scored
      .filter((s) => textMatches(last.query, restaurantHaystack(ctx, s.item)))
      .sort((a, b) => relevance(b.item) - relevance(a.item) || byScore(a, b))
      .slice(0, 8)
    const dishes = allowedDishes
      .filter((d) => textMatches(last.query, dishHaystack(ctx, d)))
      .map((d) => scoreDish(ctx, d))
      .sort(byScore)
      .slice(0, 6)
    searched = {
      key: 'searched', query: last.query, title: `Because you searched “${last.query}”`,
      reason: `Searched ${relative(last.at, now)}`,
      signals: [
        { label: 'Most recent search', detail: `“${last.query}”, ${relative(last.at, now)}` },
        ...ctx.searchList.slice(1, 4).map((s) => ({ label: 'Earlier search', detail: `“${s.query}”, weight ${decayWeight(s.at, now).toFixed(2)}` })),
        { label: 'Decay', detail: 'Searches lose half their weight every 7 days' },
      ],
      items, dishes,
    }
  } else {
    searched = {
      key: 'searched', query: null, title: 'Start with what you like', reason: 'From your onboarding picks',
      signals: prefSignals, items: scored.slice(0, 6), dishes: [],
    }
  }

  // 2. Top-rated for your tastes — strong matches, then by rating
  const top = scored
    .filter((s) => s.match >= 3 || !hasSignals(sig))
    .sort((a, b) => b.score * 0.7 + b.item.avgRating / 5 * 0.3 - (a.score * 0.7 + a.item.avgRating / 5 * 0.3))
    .slice(0, 10)

  // 3. Trending
  const trendingR = [...eligible].sort((a, b) => b.trendingScore - a.trendingScore || a.id - b.id).slice(0, 8).map((r) => scoreOf.get(r.id)!)
  const trendingD = [...allowedDishes]
    .filter((d) => d.reviewCount > 0)
    .sort((a, b) => trendScoreDish(ctx, b) - trendScoreDish(ctx, a) || a.id - b.id)
    .slice(0, 6)
    .map((d) => scoreDish(ctx, d))

  // 4. Recently viewed (most recent first, unique)
  const seen = new Set<number>()
  const recentItems = [...sig.views]
    .sort((a, b) => b.at.localeCompare(a.at))
    .filter((v) => (seen.has(v.restaurantId) ? false : (seen.add(v.restaurantId), true)))
    .map((v) => ctx.restaurantById.get(v.restaurantId))
    .filter((r): r is Restaurant => Boolean(r))
    .slice(0, 8)
    .map((r) => scoreOf.get(r.id) ?? scoreRestaurant(ctx, r))

  // 5. Your cuisines
  let cuisineIds = [...sig.prefs.cuisineIds]
  if (!cuisineIds.length) cuisineIds = [...ctx.ratedCuisine.entries()].sort((a, b) => b[1].sum / b[1].n - a[1].sum / a[1].n).map(([id]) => id)
  if (!cuisineIds.length) cuisineIds = cat.cuisines.slice(0, 6).map((c) => c.id)
  const cuisineItems = cuisineIds.map((id) => cat.cuisines.find((c) => c.id === id)).filter((c): c is Cuisine => Boolean(c))

  return {
    searched,
    top: {
      key: 'top', title: 'Top-rated for your tastes', reason: hasSignals(sig) ? 'Your cuisines × diner ratings' : 'Highest rated in Bengaluru',
      signals: [...prefSignals, ...ratingSignals(ctx)], items: top,
    },
    trending: {
      key: 'trending', title: 'Trending in Bengaluru', reason: 'Most ordered and reviewed this week',
      signals: [
        { label: 'Trending score', detail: 'Orders and reviews in the last 7 days, normalised 0–100' },
        { label: 'Filtered for you', detail: dietLine(sig.prefs) },
      ],
      items: trendingR, dishes: trendingD,
    },
    recent: {
      key: 'recent', title: 'Pick up where you left off', reason: recentItems.length ? `${recentItems.length} places you opened` : 'Nothing viewed yet',
      signals: [{ label: 'Recently viewed', detail: 'The last 20 restaurants you opened, newest first' }], items: recentItems,
    },
    cuisines: {
      key: 'cuisines', title: 'Your cuisines', reason: sig.prefs.cuisineIds.length ? 'From your taste profile' : 'Popular cuisines',
      signals: prefSignals, items: cuisineItems,
    },
    fact: dashboardFact(ctx, top),
  }
}

function trendScoreDish(ctx: Ctx, d: Dish) {
  const r = ctx.restaurantById.get(d.restaurantId)
  return bayesian(d.avgRating, d.reviewCount, ctx.globalMean, 3) * 10 + d.reviewCount * 2 + (r?.trendingScore ?? 0) / 10
}

function dietLine(p: Preferences): string {
  const d = { any: 'No diet restriction', veg: 'Vegetarian: veg + vegan dishes only', egg: 'Eggetarian: no meat or fish', vegan: 'Vegan dishes only' }[p.diet]
  return p.allergens.length ? `${d}; avoiding ${p.allergens.join(', ')}` : d
}

function prefsAsSignals(ctx: Ctx): Signal[] {
  const p = ctx.sig.prefs
  const out: Signal[] = []
  if (p.cuisineIds.length) out.push({ label: 'Cuisines you picked', detail: p.cuisineIds.map((c) => ctx.cuisineName.get(c)).filter(Boolean).join(', ') })
  if (p.flavours.length) out.push({ label: 'Flavours', detail: p.flavours.join(', ') })
  out.push({ label: 'Spice', detail: ['No heat', 'Mild', 'Medium', 'Hot'][p.spiceLevel] })
  out.push({ label: 'Diet', detail: dietLine(p) })
  return out
}

function ratingSignals(ctx: Ctx): Signal[] {
  return [...ctx.sig.reviews]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3)
    .map((rv) => ({ label: `You rated ${ctx.restaurantById.get(rv.restaurantId)?.name ?? 'a place'}`, detail: `${rv.rating}★ — ${rv.rating >= 4 ? 'boosts' : rv.rating <= 2 ? 'penalises' : 'neutral for'} similar places` }))
}

function relative(iso: string, now: number): string {
  const d = (now - new Date(iso).getTime()) / DAY
  if (d < 1 / 24) return 'just now'
  if (d < 1) return `${Math.max(1, Math.round(d * 24))} h ago`
  if (d < 2) return 'yesterday'
  return `${Math.round(d)} days ago`
}

function dashboardFact(ctx: Ctx, top: Recommendation<Restaurant>[]): string {
  const latest = [...ctx.sig.reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  if (latest) {
    const r = ctx.restaurantById.get(latest.restaurantId)
    const n = top.filter((t) => t.reasons.some((x) => x.startsWith('You rated'))).length
    if (r && n > 0) return `${n} ${n === 1 ? 'pick' : 'picks'} shaped by your ratings since ${r.name}`
  }
  const s = ctx.searchList[0]
  if (s) return `Fresh picks for “${s.query}” and ${top.length} places that fit your taste`
  return `${top.length} places across Bengaluru to start with`
}
