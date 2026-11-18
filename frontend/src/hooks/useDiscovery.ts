import { useEffect, useMemo, useState } from 'react'
import { errorMessage } from '../api/client'
import { endpoints } from '../api/endpoints'
import { useCatalog } from '../context/CatalogContext'
import { useLive } from '../context/LiveContext'
import type { Dish, Filters, Recommendation, Restaurant } from '../types'
import { bestRelaxation } from '../utils/filter'
import { useDebounce } from './useDebounce'
import { useNow } from './useNow'
import { useSignals } from './useSignals'

/**
 * Discover: filtering + full-text search run in PostgreSQL (GET /api/restaurants, /api/dishes), scored for this user.
 * Previous results stay on screen while the next query is in flight, so results reorder instead of flashing.
 */
export function useDiscovery(query: string, filters: Filters, tab: 'restaurants' | 'dishes') {
  const cat = useCatalog()
  const sig = useSignals()
  const { version } = useLive()
  const now = useNow()
  const q = useDebounce(query, 140)
  const f = useDebounce(filters, 60)
  const [res, setRes] = useState<{ restaurants: Recommendation<Restaurant>[]; dishes: Recommendation<Dish>[]; status: 'loading' | 'ready' | 'error'; error: string | null }>({ restaurants: [], dishes: [], status: 'loading', error: null })

  useEffect(() => {
    let alive = true
    Promise.all([endpoints.restaurants(q, f), endpoints.dishes(q, f)]).then(
      ([restaurants, dishes]) => { if (alive) setRes({ restaurants, dishes, status: 'ready', error: null }) },
      (e) => { if (alive) setRes((s) => ({ ...s, status: 'error', error: errorMessage(e) })) },
    )
    return () => { alive = false }
  }, [q, f, version, sig.prefs])

  const empty = res.status === 'ready' && (tab === 'restaurants' ? res.restaurants.length === 0 : res.dishes.length === 0)
  const catalog = useMemo(() => ({ cuisines: cat.cuisines, restaurants: cat.restaurants, dishes: cat.dishes }), [cat.cuisines, cat.restaurants, cat.dishes])
  // the one-click "relax a filter" suggestion is computed locally from the catalogue
  const relax = useMemo(() => (empty ? bestRelaxation(catalog, sig, q, f, now, tab) : null), [empty, catalog, sig, q, f, tab, now])
  return { ...res, relax, settledQuery: q }
}
