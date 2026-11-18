import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useCatalog } from '../../context/CatalogContext'
import { useToast } from '../../context/ToastContext'
import type { Dish } from '../../types'

/** "ADD" pill that turns into a − n + stepper, sitting on the dish photo like delivery apps do. */
export function AddToTiffin({ d }: { d: Dish }) {
  const { qtyOf, add, setQty, replaceWith, restaurantId } = useCart()
  const { byId } = useCatalog()
  const { push } = useToast()
  const qty = qtyOf(d.id)
  const onAdd = () => {
    if (add(d.restaurantId, d.id)) return
    const other = restaurantId ? byId(restaurantId)?.name : 'another restaurant'
    push({ tone: 'info', title: `Your tiffin has dishes from ${other}`, body: 'Start a new tiffin with this dish?', action: { label: 'Start new', onClick: () => replaceWith(d.restaurantId, d.id) } })
  }
  return (
    <div className="absolute inset-x-0 -bottom-4 flex justify-center">
      <AnimatePresence mode="popLayout" initial={false}>
        {qty === 0 ? (
          <motion.button key="add" type="button" onClick={onAdd} aria-label={`Add ${d.name} to your tiffin`}
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            className="liquid-chip inline-flex h-9 items-center gap-1 rounded-full px-4 text-[14px] font-bold text-veg shadow-e2 active:scale-95">
            <span className="relative z-[2] inline-flex items-center gap-1">ADD <Plus className="size-3.5" strokeWidth={3} aria-hidden /></span>
          </motion.button>
        ) : (
          <motion.div key="step" role="group" aria-label={`${d.name} quantity`}
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            className="inline-flex h-9 items-center overflow-hidden rounded-full bg-veg text-on-ink shadow-e2">
            <button type="button" onClick={() => setQty(d.id, qty - 1)} aria-label={`Remove one ${d.name}`} className="grid h-full w-9 place-items-center hover:bg-black/10"><Minus className="size-4" strokeWidth={3} /></button>
            <motion.span key={qty} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="tabular w-6 text-center text-[14px] font-bold" aria-live="polite">{qty}</motion.span>
            <button type="button" onClick={() => setQty(d.id, qty + 1)} aria-label={`Add one more ${d.name}`} className="grid h-full w-9 place-items-center hover:bg-black/10"><Plus className="size-4" strokeWidth={3} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
