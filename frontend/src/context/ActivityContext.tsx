import { createContext, useCallback, useContext, type ReactNode } from 'react'
import { SEED } from '../data/seedWorld'
import { useLocalStorage } from '../hooks/useLocalStorage'
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

export function ActivityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const uid = user?.id ?? 0
  const demo = SEED.demo.find((d) => d.userId === uid)
  const [searches, setSearches] = useLocalStorage<SearchEntry[]>(`oota:v1:searches:${uid}`, () =>
    [...(demo?.searches ?? [])].sort((a, b) => b.at.localeCompare(a.at)))
  const [views, setViews] = useLocalStorage<ViewEntry[]>(`oota:v1:views:${uid}`, () =>
    [...(demo?.views ?? [])].sort((a, b) => b.at.localeCompare(a.at)))

  const recordSearch = useCallback((e: Omit<SearchEntry, 'at'>) => {
    const q = e.query.trim()
    if (!q) return
    setSearches((prev) => [{ ...e, query: q, at: new Date().toISOString() }, ...prev].slice(0, 30))
  }, [setSearches])

  const recordView = useCallback((restaurantId: number) => {
    setViews((prev) => [{ restaurantId, at: new Date().toISOString() }, ...prev.filter((v) => v.restaurantId !== restaurantId)].slice(0, 20))
  }, [setViews])

  const clearSearches = useCallback(() => setSearches([]), [setSearches])

  return <Ctx.Provider value={{ searches, views, recordSearch, recordView, clearSearches }}>{children}</Ctx.Provider>
}

export function useActivity(): ActivityValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useActivity outside ActivityProvider')
  return v
}
