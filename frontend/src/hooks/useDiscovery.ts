import { useMemo } from 'react'
import { useCatalog } from '../context/CatalogContext'
import type { Filters } from '../types'
import { bestRelaxation, discover, type DiscoveryResult } from '../utils/filter'
import { useDebounce } from './useDebounce'
import { useNow } from './useNow'
import { useSignals } from './useSignals'

export function useDiscovery(query: string, filters: Filters, tab: 'restaurants' | 'dishes') {
  const cat = useCatalog()
  const sig = useSignals()
  const now = useNow()
  const q = useDebounce(query, 120)
  const f = useDebounce(filters, 60)
  const catalog = useMemo(() => ({ cuisines: cat.cuisines, restaurants: cat.restaurants, dishes: cat.dishes }), [cat.cuisines, cat.restaurants, cat.dishes])
  const result: DiscoveryResult = useMemo(() => discover(catalog, sig, q, f, now), [catalog, sig, q, f, now])
  const empty = tab === 'restaurants' ? result.restaurants.length === 0 : result.dishes.length === 0
  const relax = useMemo(() => (empty ? bestRelaxation(catalog, sig, q, f, now, tab) : null), [empty, catalog, sig, q, f, tab, now])
  return { ...result, relax, status: cat.status, error: cat.error, settledQuery: q }
}
