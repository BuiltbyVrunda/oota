import { useEffect, useRef } from 'react'
import { endpoints } from '../api/endpoints'
import { useAuth } from '../context/AuthContext'
import type { DashboardData } from '../types'
import { useResource } from './useResource'
import { useSignals } from './useSignals'

/** GET /api/me/recommendations — recomputed server-side (SQL candidates + Mongo signals). */
export function useRecommendations(): { data: DashboardData | null; status: 'loading' | 'ready' | 'error'; error: string | null; refresh: () => void } {
  const { user } = useAuth()
  const r = useResource(user ? `dash:${user.id}` : null, endpoints.recommendations)
  // re-rank whenever a signal changes locally (prefs, a search, a review, a view, a save)
  const sig = useSignals()
  const signature = JSON.stringify([sig.prefs, sig.searches.length && sig.searches[0]?.at, sig.reviews.map((x) => x.id + x.rating), sig.views[0]?.restaurantId])
  const first = useRef(true)
  const { refresh } = r
  useEffect(() => {
    if (first.current) { first.current = false; return }
    refresh()
  }, [signature, refresh])
  return { data: r.data, status: r.status, error: r.error, refresh: r.refresh }
}
