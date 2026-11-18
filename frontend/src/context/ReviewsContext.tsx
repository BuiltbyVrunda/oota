import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { endpoints } from '../api/endpoints'
import { useResource } from '../hooks/useResource'
import type { Review } from '../types'
import { useAuth } from './AuthContext'
import { useLive } from './LiveContext'

export type ReviewDraft = Pick<Review, 'rating' | 'text' | 'tags' | 'dishRatings'>

interface ReviewsValue {
  mine: Review[]
  myReviewFor: (restaurantId: number) => Review | undefined
  upsert: (restaurantId: number, draft: ReviewDraft) => Promise<{ avgRating: number; reviewCount: number }>
  remove: (restaurantId: number) => Promise<void>
}
const Ctx = createContext<ReviewsValue | null>(null)

/** Reviews live in MongoDB. Posting one triggers the server-side sync that updates the Postgres rating cache. */
export function ReviewsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const r = useResource(user ? `myreviews:${user.id}` : null, endpoints.myReviews)
  const mine = useMemo(() => r.data ?? [], [r.data])
  const { refresh } = r
  const myReviewFor = useCallback((id: number) => mine.find((x) => x.restaurantId === id), [mine])
  const upsert = useCallback(async (restaurantId: number, d: ReviewDraft) => {
    const out = await endpoints.upsertReview(restaurantId, d)
    refresh()
    return out.restaurant
  }, [refresh])
  const remove = useCallback(async (restaurantId: number) => {
    await endpoints.deleteReview(restaurantId)
    refresh()
  }, [refresh])
  return <Ctx.Provider value={{ mine, myReviewFor, upsert, remove }}>{children}</Ctx.Provider>
}

export function useReviews(): ReviewsValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useReviews outside ReviewsProvider')
  return v
}

/** All reviews for one restaurant (fetched on demand, refetched on live changes). */
export function useRestaurantReviews(restaurantId: number | undefined) {
  const { version } = useLive()
  const { mine } = useReviews()
  const [state, setState] = useState<{ id?: number; list: Review[]; status: 'loading' | 'ready' | 'error' }>({ list: [], status: 'loading' })
  useEffect(() => {
    if (!restaurantId) return
    let alive = true
    endpoints.reviewsFor(restaurantId).then(
      (list) => { if (alive) setState({ id: restaurantId, list, status: 'ready' }) },
      () => { if (alive) setState((s) => ({ ...s, status: 'error' })) },
    )
    return () => { alive = false }
  }, [restaurantId, version, mine])
  return state.id === restaurantId ? state : { list: [], status: 'loading' as const }
}
