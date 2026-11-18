import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useAuth } from './AuthContext'
import { useCatalog } from './CatalogContext'

/** One restaurant per tiffin (like most delivery apps). Kept on this device until the order is placed. */
interface Cart { restaurantId: number | null; items: Record<number, number> }
interface CartLine { dishId: number; name: string; price: number; qty: number; diet: string; imageUrl: string }
interface CartValue {
  restaurantId: number | null
  lines: CartLine[]
  count: number
  total: number
  qtyOf: (dishId: number) => number
  /** returns false when the dish is from a different restaurant than the current tiffin */
  add: (restaurantId: number, dishId: number) => boolean
  setQty: (dishId: number, qty: number) => void
  replaceWith: (restaurantId: number, dishId: number) => void
  clear: () => void
}
const Ctx = createContext<CartValue | null>(null)
const EMPTY: Cart = { restaurantId: null, items: {} }

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { dishes } = useCatalog()
  const [cart, setCart] = useLocalStorage<Cart>(`oota:v1:cart:${user?.id ?? 0}`, EMPTY)

  const lines = useMemo(() => Object.entries(cart.items).flatMap(([id, qty]) => {
    const d = dishes.find((x) => x.id === Number(id))
    return d ? [{ dishId: d.id, name: d.name, price: d.price, qty, diet: d.diet, imageUrl: d.imageUrl }] : [] // dishes removed / sold out drop out
  }), [cart.items, dishes])

  const add = useCallback((restaurantId: number, dishId: number) => {
    if (cart.restaurantId !== null && cart.restaurantId !== restaurantId && Object.keys(cart.items).length) return false
    setCart((c) => ({ restaurantId, items: { ...(c.restaurantId === restaurantId ? c.items : {}), [dishId]: Math.min(20, ((c.restaurantId === restaurantId ? c.items[dishId] : 0) ?? 0) + 1) } }))
    return true
  }, [cart, setCart])
  const setQty = useCallback((dishId: number, qty: number) => setCart((c) => {
    const items = { ...c.items }
    if (qty <= 0) delete items[dishId]
    else items[dishId] = Math.min(20, qty)
    return Object.keys(items).length ? { ...c, items } : EMPTY
  }), [setCart])
  const replaceWith = useCallback((restaurantId: number, dishId: number) => setCart({ restaurantId, items: { [dishId]: 1 } }), [setCart])
  const clear = useCallback(() => setCart(EMPTY), [setCart])

  const value = useMemo<CartValue>(() => ({
    restaurantId: lines.length ? cart.restaurantId : null, lines,
    count: lines.reduce((s, l) => s + l.qty, 0), total: lines.reduce((s, l) => s + l.qty * l.price, 0),
    qtyOf: (id) => cart.items[id] ?? 0, add, setQty, replaceWith, clear,
  }), [lines, cart, add, setQty, replaceWith, clear])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCart(): CartValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useCart outside CartProvider')
  return v
}
