import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconButton } from './IconButton'

interface Props { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; footer?: ReactNode }

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'

/** The one allowed modal (review). Focus trap, Esc closes, focus returns to the trigger. */
export function Modal({ open, onClose, title, description, children, footer }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const body = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = window.setTimeout(() => {
      const first = ref.current?.querySelector<HTMLElement>('[data-autofocus]') ?? ref.current?.querySelector<HTMLElement>(FOCUSABLE)
      first?.focus()
    }, 30)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
      if (e.key !== 'Tab' || !ref.current) return
      const els = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null)
      if (!els.length) return
      const first = els[0]
      const last = els[els.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = body
      prev?.focus()
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <motion.div className="absolute inset-0 bg-graphite/30" onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
          <motion.div
            ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descId : undefined}
            className="liquid liquid-strong relative flex max-h-[92dvh] w-full max-w-[620px] flex-col overflow-hidden rounded-t-tier sm:rounded-tier"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            <header className="relative z-[2] flex items-start gap-4 border-b border-seam px-6 pb-4 pt-6">
              <div className="flex-1">
                <h2 id={titleId} className="text-[24px]">{title}</h2>
                {description && <p id={descId} className="mt-1 text-[14px] text-ink-3">{description}</p>}
              </div>
              <IconButton label="Close" onClick={onClose} size="sm"><X className="size-4" /></IconButton>
            </header>
            <div className="relative z-[2] flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <footer className="relative z-[2] flex items-center justify-end gap-3 border-t border-seam px-6 py-4">{footer}</footer>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
