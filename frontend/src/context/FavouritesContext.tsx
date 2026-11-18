import { createContext, useCallback, useContext, type ReactNode } from 'react'
import { SEED } from '../data/seedWorld'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useAuth } from './AuthContext'

interface FavValue { ids: number[]; isSaved: (id: number) => boolean; toggle: (id: number) => boolean }
const Ctx = createContext<FavValue | null>(null)

export function FavouritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const uid = user?.id ?? 0
  const [ids, setIds] = useLocalStorage<number[]>(`oota:v1:favs:${uid}`, () => SEED.demo.find((d) => d.userId === uid)?.favourites ?? [])
  const isSaved = useCallback((id: number) => ids.includes(id), [ids])
  const toggle = useCallback((id: number) => {
    const next = !ids.includes(id)
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]))
    return next
  }, [ids, setIds])
  return <Ctx.Provider value={{ ids, isSaved, toggle }}>{children}</Ctx.Provider>
}

export function useFavourites(): FavValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useFavourites outside FavouritesProvider')
  return v
}
