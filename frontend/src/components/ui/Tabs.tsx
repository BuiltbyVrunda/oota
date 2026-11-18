import { motion } from 'framer-motion'
import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../utils/cn'

export interface TabItem<K extends string> { key: K; label: ReactNode; count?: number }
interface Props<K extends string> { items: TabItem<K>[]; value: K; onChange: (k: K) => void; label: string; className?: string; size?: 'sm' | 'md' }

/** Segmented control with a liquid indicator that glides between options. Arrow keys move. */
export function Tabs<K extends string>({ items, value, onChange, label, className, size = 'md' }: Props<K>) {
  const id = useId()
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const onKey = (e: KeyboardEvent, i: number) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!dir) return
    e.preventDefault()
    const n = (i + dir + items.length) % items.length
    onChange(items[n].key)
    refs.current[n]?.focus()
  }
  return (
    <div role="tablist" aria-label={label} className={cn('liquid-flat inline-flex rounded-full p-1', className)}>
      {items.map((t, i) => {
        const active = t.key === value
        return (
          <button key={t.key} ref={(el) => { refs.current[i] = el }} role="tab" type="button" aria-selected={active} tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.key)} onKeyDown={(e) => onKey(e, i)}
            className={cn('relative z-[2] flex items-center gap-2 rounded-full font-medium transition-colors',
              size === 'md' ? 'h-10 px-4 text-[15px]' : 'h-8 px-3 text-[14px]', active ? 'text-on-ink' : 'text-ink-2 hover:text-ink')}>
            {active && (
              <motion.span layoutId={`tab-${id}`} className="absolute inset-0 -z-10 rounded-full bg-ink shadow-e2"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
            )}
            {t.label}
            {t.count !== undefined && (
              <span className={cn('tabular rounded-full px-1.5 text-[12px] font-semibold', active ? 'bg-on-ink/20' : 'bg-plate-strong text-ink-3')}>{t.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
