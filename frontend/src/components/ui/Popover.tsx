import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface Props {
  trigger: (p: { open: boolean; toggle: () => void; id: string }) => ReactNode
  children: ReactNode | ((close: () => void) => ReactNode)
  align?: 'start' | 'end'; className?: string; label: string
}

/** Click-anchored popover. Esc / outside click close it; focus returns to the trigger. */
export function Popover({ trigger, children, align = 'start', className, label }: Props) {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const id = useId()
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        wrap.current?.querySelector<HTMLElement>('[aria-controls]')?.focus()
      }
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])
  const close = () => setOpen(false)
  return (
    <div ref={wrap} className="relative inline-flex">
      {trigger({ open, toggle: () => setOpen((o) => !o), id })}
      <AnimatePresence>
        {open && (
          <motion.div id={id} role="dialog" aria-label={label}
            initial={{ opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 520, damping: 34 }}
            style={{ transformOrigin: align === 'end' ? 'top right' : 'top left' }}
            className={cn('liquid liquid-strong absolute top-[calc(100%+10px)] z-40 w-[min(340px,calc(100vw-32px))] rounded-card p-4',
              align === 'end' ? 'right-0' : 'left-0', className)}>
            <div className="relative z-[2]">{typeof children === 'function' ? children(close) : children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
