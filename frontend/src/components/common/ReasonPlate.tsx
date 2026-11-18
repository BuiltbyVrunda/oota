import { ChevronDown } from 'lucide-react'
import type { Signal } from '../../types'
import { cn } from '../../utils/cn'
import { Popover } from '../ui/Popover'

/** Engraved steel nameplate that opens to show the signals behind a tier. */
export function ReasonPlate({ reason, signals, title }: { reason: string; signals: Signal[]; title: string }) {
  return (
    <Popover label={`Why you see ${title}`} align="end" trigger={({ open, toggle, id }) => (
      <button type="button" onClick={toggle} aria-expanded={open} aria-controls={id}
        className={cn('steel-plate group inline-flex h-8 max-w-full items-center gap-1.5 rounded-sm px-3 text-[13px] font-semibold tracking-[0.01em]',
          'transition-transform hover:-translate-y-px active:translate-y-0')}>
        <span className="truncate">{reason}</span>
        <ChevronDown className={cn('size-3.5 shrink-0 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
    )}>
      <p className="text-[13px] font-semibold text-ink-3">Why these picks</p>
      <ul className="mt-3 flex flex-col gap-3">
        {signals.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-haldi shadow-[0_0_8px_var(--haldi)]" aria-hidden />
            <div>
              <p className="text-[14px] font-semibold text-ink">{s.label}</p>
              <p className="text-[14px] text-ink-2">{s.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </Popover>
  )
}
