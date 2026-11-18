import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { errorMessage } from '../api/client'
import { endpoints } from '../api/endpoints'
import { useResource } from '../hooks/useResource'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

interface FavValue { ids: number[]; status: 'loading' | 'ready' | 'error'; error: string | null; isSaved: (id: number) => boolean; toggle: (id: number) => boolean }
const Ctx = createContext<FavValue | null>(null)

/** PostgreSQL favourite_restaurants (composite PK user_id + restaurant_id). Optimistic, reverts on error. */
export function FavouritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { push } = useToast()
  const r = useResource(user ? `favs:${user.id}` : null, endpoints.favourites)
  const ids = useMemo(() => r.data ?? [], [r.data])
  const { mutate } = r
  const isSaved = useCallback((id: number) => ids.includes(id), [ids])
  const toggle = useCallback((id: number) => {
    const next = !ids.includes(id)
    mutate((prev) => (next ? [id, ...(prev ?? [])] : (prev ?? []).filter((x) => x !== id)))
    ;(next ? endpoints.addFavourite(id) : endpoints.removeFavourite(id)).catch((e) => {
      mutate((prev) => (next ? (prev ?? []).filter((x) => x !== id) : [id, ...(prev ?? [])]))
      push({ tone: 'error', title: 'Couldn’t update Saved', body: errorMessage(e) })
    })
    return next
  }, [ids, mutate, push])
  return <Ctx.Provider value={{ ids, status: r.status, error: r.error, isSaved, toggle }}>{children}</Ctx.Provider>
}

export function useFavourites(): FavValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useFavourites outside FavouritesProvider')
  return v
}
