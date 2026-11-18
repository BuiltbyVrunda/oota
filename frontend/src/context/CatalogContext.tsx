import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { endpoints } from '../api/endpoints'
import { useResource } from '../hooks/useResource'
import type { Cuisine, Dish, Restaurant } from '../types'

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
const EMPTY = { cuisines: [] as Cuisine[], restaurants: [] as Restaurant[], dishes: [] as Dish[] }

/** Restaurants, dishes, cuisines from PostgreSQL (GET /api/catalog). Refetched the moment the database changes. */
export function CatalogProvider({ children }: { children: ReactNode }) {
  const r = useResource('catalog', endpoints.catalog)
  const value = useMemo<CatalogValue>(() => {
    // a failed refetch (e.g. a table dropped in the terminal) must show, so don't keep serving stale data on error
    const data = r.status === 'error' ? EMPTY : r.data ?? EMPTY
    const rBySlug = new Map(data.restaurants.map((x) => [x.slug, x]))
    const rById = new Map(data.restaurants.map((x) => [x.id, x]))
    const cById = new Map(data.cuisines.map((c) => [c.id, c]))
    const menus = new Map<number, Dish[]>()
    for (const d of data.dishes) menus.set(d.restaurantId, [...(menus.get(d.restaurantId) ?? []), d])
    return {
      ...data, status: r.status, error: r.error,
      bySlug: (s) => rBySlug.get(s), byId: (id) => rById.get(id), cuisineById: (id) => cById.get(id),
      menuOf: (id) => menus.get(id) ?? [], refresh: r.refresh,
    }
  }, [r.data, r.status, r.error, r.refresh])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCatalog(): CatalogValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useCatalog outside CatalogProvider')
  return v
}
