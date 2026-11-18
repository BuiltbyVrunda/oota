import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import { useFavourites } from '../../context/FavouritesContext'
import { LIKE_EVENT, useLikeBurst, type LikeEventDetail } from '../../context/LikeBurstContext'
import { cn } from '../../utils/cn'

/**
 * Heart / save toggle. Saving plays the like burst: a big heart pops over the photo (or at the double-tap point)
 * and flies into this button, which fills when it lands. Un-saving just empties the heart.
 */
export function SaveButton({ restaurantId, name, className, withLabel }: { restaurantId: number; name: string; className?: string; withLabel?: boolean }) {
  const { isSaved, toggle } = useFavourites()
  const burst = useLikeBurst()
  const ref = useRef<HTMLButtonElement>(null)
  const iconRef = useRef<HTMLSpanElement>(null) // the heart lands on the icon, not the middle of a labelled button
  const saved = isSaved(restaurantId)
  const [inFlight, setInFlight] = useState(false)
  const [landed, setLanded] = useState(0)
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  const filled = saved && !inFlight

  const like = useCallback((from?: { x: number; y: number }) => {
    const btn = ref.current
    if (!btn) return
    const b = (iconRef.current ?? btn).getBoundingClientRect()
    const to = { x: b.left + b.width / 2, y: b.top + b.height / 2 }
    // start from the photo this button belongs to (or straight above the button)
    let start = from
    if (!start) {
      const origin = btn.closest('[data-like-surface]')?.querySelector('[data-like-origin]') ?? btn.closest('[data-like-surface]')
      const r = origin?.getBoundingClientRect()
      start = r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: to.x - 40, y: to.y - 120 }
    }
    toggle(restaurantId)
    setInFlight(true)
    // live target: re-measured every frame of the flight
    const target = () => {
      const el = iconRef.current ?? ref.current
      if (!el || !el.isConnected) return null
      const r = el.getBoundingClientRect()
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    }
    burst(start, target, () => { if (mounted.current) { setInFlight(false); setLanded((n) => n + 1) } })
  }, [burst, restaurantId, toggle])

  // double-tap surfaces ask the matching button to like
  useEffect(() => {
    const onLike = (e: Event) => {
      const d = (e as CustomEvent<LikeEventDetail>).detail
      if (d.restaurantId === restaurantId && !saved) like({ x: d.x, y: d.y })
    }
    window.addEventListener(LIKE_EVENT, onLike)
    return () => window.removeEventListener(LIKE_EVENT, onLike)
  }, [like, restaurantId, saved])

  const onClick = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!saved) { like(); return }
    toggle(restaurantId) // un-save: the heart just empties — no toast (errors still toast from FavouritesContext)
  }

  return (
    <button ref={ref} type="button" onClick={onClick} aria-pressed={saved} aria-label={saved ? `Remove ${name} from saved` : `Save ${name}`}
      className={cn('liquid-chip relative inline-flex items-center justify-center gap-2 rounded-full text-ink transition-transform active:scale-90',
        withLabel ? 'h-11 px-4 text-[15px] font-medium' : 'size-11', className)}>
      <span ref={iconRef} className="relative z-[2] grid place-items-center">
      <motion.span className="grid place-items-center" key={`${filled}-${landed}`}
        initial={{ scale: filled ? 0.4 : 1 }} animate={{ scale: filled ? [0.4, 1.35, 0.92, 1] : 1 }}
        transition={{ duration: 0.42, times: [0, 0.4, 0.7, 1], ease: 'easeOut' }}>
        <Heart className={cn('size-5 transition-colors', filled && 'fill-like-b text-like-b drop-shadow-[0_0_8px_var(--like-a)]')} aria-hidden />
      </motion.span>
      </span>
      {withLabel && <span className="relative z-[2]">{saved ? 'Saved' : 'Save'}</span>}
    </button>
  )
}
