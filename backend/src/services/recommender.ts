/**
 * Server-side recommender. The scoring itself is the same pure module as the frontend (src/shared/recommend.ts,
 * ported verbatim so both sides agree). What changes here is where the data comes from:
 *   1. hard filters (diet + allergens) run in SQL to pick candidate dishes,
 *   2. candidates come from PostgreSQL, signals from MongoDB,
 *   3. scoring + reasons in TypeScript.
 */
import { q } from '../db/pg.ts'
import { buildDashboard } from '../shared/recommend.ts'
import { getCatalog } from './catalog.ts'
import { getSignals } from './signals.ts'

const DIETS_FOR = { any: ['veg', 'egg', 'nonveg', 'vegan'], veg: ['veg', 'vegan'], egg: ['veg', 'egg', 'vegan'], vegan: ['vegan'] } as const

/** Hard filter in SQL: dish ids this user may be recommended. Uses the diet CHECK domain and the allergens array (&& = overlap). */
export async function allowedDishIds(diet: keyof typeof DIETS_FOR, allergens: string[]): Promise<Set<number>> {
  const rows = await q<{ id: number }>(
    `SELECT dish_id AS id FROM dishes
      WHERE is_available AND diet = ANY($1::text[]) AND NOT (allergens && $2::text[])`,
    [DIETS_FOR[diet], allergens])
  return new Set(rows.map((r) => r.id))
}

export async function dashboardFor(userId: number) {
  const [catalog, signals] = await Promise.all([getCatalog(), getSignals(userId)])
  const allowed = await allowedDishIds(signals.prefs.diet, signals.prefs.allergens)
  // Restaurants keep their full menus so eligibility can count compatible dishes; the SQL hard filter is then
  // enforced on every dish pick (the shared scorer applies the same rule, this makes the SQL the authority).
  const d = buildDashboard(catalog, signals, Date.now())
  const keep = <T extends { item: { id: number } }>(xs: T[]) => xs.filter((x) => allowed.has(x.item.id))
  d.searched.dishes = keep(d.searched.dishes)
  d.trending.dishes = keep(d.trending.dishes)
  return d
}
