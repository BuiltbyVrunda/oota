import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { SEED } from '../data/seedWorld'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { Review } from '../types'
import { useAuth } from './AuthContext'

export type ReviewDraft = Pick<Review, 'rating' | 'text' | 'tags' | 'dishRatings'>

interface ReviewsValue {
  all: Review[]
  forRestaurant: (restaurantId: number) => Review[]
  mine: Review[]
  myReviewFor: (restaurantId: number) => Review | undefined
  upsert: (restaurantId: number, draft: ReviewDraft) => Promise<Review>
  remove: (restaurantId: number) => Promise<void>
}
const Ctx = createContext<ReviewsValue | null>(null)

/** One review per user per place (edit = upsert) — mirrors the Mongo unique index {userId, restaurantId}. */
export function ReviewsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [local, setLocal] = useLocalStorage<Review[]>('oota:v1:reviews', [])
  const [deleted, setDeleted] = useLocalStorage<string[]>('oota:v1:reviews-deleted', [])

  const all = useMemo(() => {
    const key = (r: Review) => `${r.userId}:${r.restaurantId}`
    const overridden = new Set(local.map(key))
    return [...SEED.reviews.filter((r) => !overridden.has(key(r)) && !deleted.includes(key(r))), ...local]
  }, [local, deleted])

  const forRestaurant = useCallback((id: number) => all.filter((r) => r.restaurantId === id), [all])
  const mine = useMemo(() => (user ? all.filter((r) => r.userId === user.id) : []), [all, user])
  const myReviewFor = useCallback((id: number) => mine.find((r) => r.restaurantId === id), [mine])

  const upsert = useCallback(async (restaurantId: number, d: ReviewDraft) => {
    if (!user) throw new Error('Not logged in')
    const existing = all.find((r) => r.userId === user.id && r.restaurantId === restaurantId)
    const review: Review = {
      id: existing?.id ?? `local-${user.id}-${restaurantId}`,
      restaurantId, userId: user.id, userName: user.fullName, ...d, createdAt: new Date().toISOString(),
    }
    setLocal((prev) => [...prev.filter((r) => !(r.userId === user.id && r.restaurantId === restaurantId)), review])
    setDeleted((prev) => prev.filter((k) => k !== `${user.id}:${restaurantId}`))
    return review
  }, [user, all, setLocal, setDeleted])

  const remove = useCallback(async (restaurantId: number) => {
    if (!user) return
    setLocal((prev) => prev.filter((r) => !(r.userId === user.id && r.restaurantId === restaurantId)))
    setDeleted((prev) => [...prev, `${user.id}:${restaurantId}`])
  }, [user, setLocal, setDeleted])

  return <Ctx.Provider value={{ all, forRestaurant, mine, myReviewFor, upsert, remove }}>{children}</Ctx.Provider>
}

export function useReviews(): ReviewsValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useReviews outside ReviewsProvider')
  return v
}
