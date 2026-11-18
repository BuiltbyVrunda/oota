import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { endpoints } from '../api/endpoints'
import { useResource } from '../hooks/useResource'
import type { SearchEntry, ViewEntry } from '../types'
import { useAuth } from './AuthContext'

interface ActivityValue {
  searches: SearchEntry[] // newest first
  views: ViewEntry[] // newest first
  recordSearch: (e: Omit<SearchEntry, 'at'>) => void
  recordView: (restaurantId: number) => void
  clearSearches: () => void
}
const Ctx = createContext<ActivityValue | null>(null)

/** Search history + recently viewed — MongoDB (search_history with a 90-day TTL, restaurant_views). */
export function ActivityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const s = useResource(user ? `searches:${user.id}` : null, endpoints.searches)
  const v = useResource(user ? `views:${user.id}` : null, endpoints.views)
  const ms = s.mutate
  const mv = v.mutate

  const recordSearch = useCallback((e: Omit<SearchEntry, 'at'>) => {
    const q = e.query.trim()
    if (!q) return
    ms((prev) => [{ ...e, query: q, at: new Date().toISOString() }, ...(prev ?? [])].slice(0, 30))
    void endpoints.recordSearch({ ...e, query: q }).catch(() => {})
  }, [ms])

  const recordView = useCallback((restaurantId: number) => {
    mv((prev) => [{ restaurantId, at: new Date().toISOString() }, ...(prev ?? []).filter((x) => x.restaurantId !== restaurantId)].slice(0, 20))
    void endpoints.recordView(restaurantId).catch(() => {})
  }, [mv])

  const clearSearches = useCallback(() => {
    ms(() => [])
    void endpoints.clearSearches().catch(() => {})
  }, [ms])

  const value = useMemo(() => ({ searches: s.data ?? [], views: v.data ?? [], recordSearch, recordView, clearSearches }), [s.data, v.data, recordSearch, recordView, clearSearches])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useActivity(): ActivityValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useActivity outside ActivityProvider')
  return v
}
