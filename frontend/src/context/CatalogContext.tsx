import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { applyRatings } from '../data/catalog'
import { cuisines } from '../data/cuisines'
import { baseDishes } from '../data/dishes'
import { baseRestaurants } from '../data/restaurants'
import type { Cuisine, Dish, Restaurant } from '../types'
import { useReviews } from './ReviewsContext'

interface CatalogValue {
  cuisines: Cuisine[]; restaurants: Restaurant[]; dishes: Dish[]
  status: 'loading' | 'ready' | 'error'; error: string | null
  bySlug: (slug: string) => Restaurant | undefined
  byId: (id: number) => Restaurant | undefined
  menuOf: (restaurantId: number) => Dish[]
  cuisineById: (id: number) => Cuisine | undefined
  refresh: () => void
}
const Ctx = createContext<CatalogValue | null>(null)

/** Restaurants, dishes, cuisines. Cached ratings are recomputed from reviews (same aggregate the backend syncs). */
export function CatalogProvider({ children }: { children: ReactNode }) {
  const { all } = useReviews()
  const value = useMemo<CatalogValue>(() => {
    const { restaurants, dishes } = applyRatings(baseRestaurants, baseDishes, all)
    const rBySlug = new Map(restaurants.map((r) => [r.slug, r]))
    const rById = new Map(restaurants.map((r) => [r.id, r]))
    const cById = new Map(cuisines.map((c) => [c.id, c]))
    return {
      cuisines, restaurants, dishes, status: 'ready', error: null,
      bySlug: (s) => rBySlug.get(s), byId: (id) => rById.get(id), cuisineById: (id) => cById.get(id),
      menuOf: (id) => dishes.filter((d) => d.restaurantId === id),
      refresh: () => {},
    }
  }, [all])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCatalog(): CatalogValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useCatalog outside CatalogProvider')
  return v
}
