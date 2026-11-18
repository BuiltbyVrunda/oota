import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'
import { cn } from '../../utils/cn'

const words = ['', 'Poor', 'Below par', 'Good', 'Great', 'Outstanding']

interface Props { value: number; onChange: (v: 1 | 2 | 3 | 4 | 5) => void; label: string; size?: 'sm' | 'lg'; id?: string; autoFocus?: boolean }

/** Radiogroup of five stars; arrow keys change, hover previews. */
export function StarInput({ value, onChange, label, size = 'lg', id, autoFocus }: Props) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); onChange(Math.min(5, (value || 0) + 1) as 1) }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); onChange(Math.max(1, (value || 2) - 1) as 1) }
  }
  return (
    <div className="flex items-center gap-3">
      <div id={id} role="radiogroup" aria-label={label} onKeyDown={onKey} onMouseLeave={() => setHover(0)} className="flex items-center">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? 's' : ''}`}
            data-autofocus={autoFocus && n === (value || 1) ? '' : undefined}
            tabIndex={(value || 1) === n ? 0 : -1} onMouseEnter={() => setHover(n)} onClick={() => onChange(n as 1)}
            className={cn('grid place-items-center rounded-full', size === 'lg' ? 'size-12' : 'size-9')}>
            <motion.span animate={{ scale: n <= shown ? 1 : 0.86 }} transition={{ type: 'spring', stiffness: 600, damping: 20 }}>
              <Star className={cn(size === 'lg' ? 'size-8' : 'size-5', n <= shown ? 'fill-haldi text-haldi drop-shadow-[0_0_10px_rgb(255_176_32/0.55)]' : 'text-seam-strong')} />
            </motion.span>
          </button>
        ))}
      </div>
      {size === 'lg' && <span className="min-w-24 text-[15px] font-semibold text-haldi-ink" aria-live="polite">{words[shown]}</span>}
    </div>
  )
}
