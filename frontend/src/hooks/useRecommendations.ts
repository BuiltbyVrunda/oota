import { useMemo } from 'react'
import { useCatalog } from '../context/CatalogContext'
import type { DashboardData } from '../types'
import { buildDashboard } from '../utils/recommend'
import { useNow } from './useNow'
import { useSignals } from './useSignals'

export function useRecommendations(): { data: DashboardData | null; status: 'loading' | 'ready' | 'error'; error: string | null } {
  const cat = useCatalog()
  const sig = useSignals()
  const now = useNow()
  const data = useMemo(
    () => (cat.status === 'ready' ? buildDashboard({ cuisines: cat.cuisines, restaurants: cat.restaurants, dishes: cat.dishes }, sig, now) : null),
    [cat.status, cat.cuisines, cat.restaurants, cat.dishes, sig, now],
  )
  return { data, status: cat.status, error: cat.error }
}
