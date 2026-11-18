import { AnimatePresence, motion } from 'framer-motion'
import { ChevronUp, Minus, Plus, ShoppingBag, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { errorMessage } from '../../api/client'
import { endpoints } from '../../api/endpoints'
import { useCart } from '../../context/CartContext'
import { useCatalog } from '../../context/CatalogContext'
import { useToast } from '../../context/ToastContext'
import { inr, plural } from '../../utils/format'
import { DietMark } from '../ui/DietMark'
import { Button } from '../ui/Button'
import { IconButton } from '../ui/IconButton'
import type { Diet } from '../../types'

/**
 * Floating "Your tiffin" bar → bottom sheet with quantities → Place order.
 * Placing an order is one PostgreSQL transaction; the total shown afterwards is the one the trigger computed.
 */
export function TiffinBar() {
  const { lines, count, total, restaurantId, setQty, clear } = useCart()
  const { byId } = useCatalog()
  const { push } = useToast()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const r = restaurantId ? byId(restaurantId) : undefined

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])
  if (!count || !r) return null

  const place = async () => {
    setBusy(true)
    try {
      const o = await endpoints.placeOrder(r.id, lines.map((l) => ({ dishId: l.dishId, quantity: l.qty })))
      clear()
      setOpen(false)
      push({ tone: 'success', title: `Order #${o.id} placed`, body: `${r.name} · ${inr(o.total)}. Track it in Orders.` })
      navigate('/orders')
    } catch (e) {
      push({ tone: 'error', title: 'Couldn’t place the order', body: errorMessage(e) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <AnimatePresence>
        {open && <motion.div className="fixed inset-0 z-40 bg-graphite/30" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}
      </AnimatePresence>
      <motion.div layout initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        className="fixed inset-x-0 bottom-[92px] z-40 px-3 md:bottom-6">
        <motion.div layout className="liquid-lens mx-auto max-w-[560px] overflow-hidden rounded-[26px]" role={open ? 'dialog' : undefined} aria-label={open ? 'Your tiffin' : undefined}>
          <AnimatePresence initial={false}>
            {open && (
              <motion.div key="sheet" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 360, damping: 34 }}
                className="relative z-[2] overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-4">
                  <div>
                    <p className="text-[18px] font-semibold">Your tiffin</p>
                    <p className="text-[13px] text-ink-3">from {r.name}</p>
                  </div>
                  <IconButton label="Close" size="sm" onClick={() => setOpen(false)}><X className="size-4" /></IconButton>
                </div>
                <ul className="max-h-[42vh] divide-y divide-seam overflow-y-auto px-5 py-2">
                  {lines.map((l) => (
                    <li key={l.dishId} className="flex items-center gap-3 py-2.5">
                      <DietMark diet={l.diet as Diet} />
                      <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{l.name}</span>
                      <span className="inline-flex h-8 items-center rounded-full border border-seam bg-plate-strong">
                        <button type="button" onClick={() => setQty(l.dishId, l.qty - 1)} aria-label={`Remove one ${l.name}`} className="grid h-full w-8 place-items-center"><Minus className="size-3.5" /></button>
                        <span className="tabular w-5 text-center text-[14px] font-semibold">{l.qty}</span>
                        <button type="button" onClick={() => setQty(l.dishId, l.qty + 1)} aria-label={`Add one more ${l.name}`} className="grid h-full w-8 place-items-center"><Plus className="size-3.5" /></button>
                      </span>
                      <span className="tabular w-16 text-right text-[15px] font-semibold">{inr(l.qty * l.price)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between border-t border-seam px-5 py-3 text-[15px]">
                  <button type="button" onClick={() => { clear(); setOpen(false) }} className="text-[14px] font-medium text-ink-3 hover:text-danger">Empty tiffin</button>
                  <span>Total <span className="tabular font-display text-[22px] font-semibold">{inr(total)}</span></span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="relative z-[2] flex items-center gap-3 p-2 pl-4">
            <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-veg text-on-ink">
                <ShoppingBag className="size-5" aria-hidden />
                <motion.span key={count} initial={{ scale: 1.6 }} animate={{ scale: 1 }} className="tabular absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-haldi text-[11px] font-bold text-on-haldi">{count}</motion.span>
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-semibold">{plural(count, 'item')} · <span className="tabular">{inr(total)}</span></span>
                <span className="flex items-center gap-1 text-[13px] text-ink-3">{open ? 'Hide' : 'View'} tiffin <ChevronUp className={`size-3.5 transition-transform ${open ? '' : 'rotate-180'}`} aria-hidden /></span>
              </span>
            </button>
            <Button variant="accent" onClick={() => (open ? void place() : setOpen(true))} loading={busy}>{open ? 'Place order' : 'Checkout'}</Button>
          </div>
        </motion.div>
      </motion.div>
    </>
  )
}
