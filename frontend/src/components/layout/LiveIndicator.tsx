import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLive, type ChangeEvent } from '../../context/LiveContext'
import { cn } from '../../utils/cn'

/** "Live" dot in the top bar; flashes the table + operation whenever either database changes. */
export function LiveIndicator() {
  const { connected, last } = useLive()
  const [flash, setFlash] = useState<ChangeEvent | null>(null)
  const [seen, setSeen] = useState<ChangeEvent | null>(null)
  if (last !== seen) { setSeen(last); setFlash(last) }
  useEffect(() => {
    if (!flash) return
    const t = window.setTimeout(() => setFlash(null), 2600)
    return () => window.clearTimeout(t)
  }, [flash])
  return (
    <Link to="/status" className="relative hidden h-11 items-center gap-2 rounded-full px-3 text-[13px] font-semibold text-ink-2 hover:bg-brushed sm:flex"
      aria-label={connected ? 'Live database: connected' : 'Live database: reconnecting'} title="Live database">
      <span className={cn('size-2 rounded-full', connected ? 'bg-veg shadow-[0_0_0_3px_var(--veg-wash)]' : 'bg-pewter')} aria-hidden />
      <AnimatePresence mode="wait" initial={false}>
        {flash ? (
          <motion.span key={flash.at} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
            className="max-w-40 truncate text-haldi-ink">{flash.table} · {flash.op}</motion.span>
        ) : (
          <motion.span key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>Live</motion.span>
        )}
      </AnimatePresence>
    </Link>
  )
}
