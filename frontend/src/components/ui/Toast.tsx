import { AnimatePresence, motion } from 'framer-motion'
import { CircleAlert, Check, Info, X } from 'lucide-react'
import { useToast, useToastList } from '../../context/ToastContext'
import { cn } from '../../utils/cn'

export function Toaster() {
  const { dismiss } = useToast()
  const toasts = useToastList()
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-8">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div key={t.id} layout role={t.tone === 'error' ? 'alert' : 'status'}
            initial={{ opacity: 0, y: 24, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }} transition={{ type: 'spring', stiffness: 460, damping: 32 }}
            className="liquid liquid-strong pointer-events-auto flex w-full max-w-[440px] items-start gap-3 rounded-card py-3 pl-3.5 pr-2">
            <span className={cn('relative z-[2] mt-0.5 grid size-7 shrink-0 place-items-center rounded-full',
              t.tone === 'success' && 'bg-veg-wash text-veg', t.tone === 'error' && 'bg-danger-wash text-danger', t.tone === 'info' && 'bg-haldi-wash text-haldi-ink')}>
              {t.tone === 'success' ? <Check className="size-4" /> : t.tone === 'error' ? <CircleAlert className="size-4" /> : <Info className="size-4" />}
            </span>
            <div className="relative z-[2] flex-1 py-0.5">
              <p className="text-[15px] font-semibold">{t.title}</p>
              {t.body && <p className="mt-0.5 text-[14px] text-ink-2">{t.body}</p>}
            </div>
            {t.action && (
              <button type="button" onClick={() => { t.action?.onClick(); dismiss(t.id) }}
                className="relative z-[2] h-9 rounded-full px-3 text-[14px] font-semibold text-haldi-ink hover:bg-haldi-wash">{t.action.label}</button>
            )}
            <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)} className="relative z-[2] grid size-9 place-items-center rounded-full text-pewter hover:text-ink">
              <X className="size-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
