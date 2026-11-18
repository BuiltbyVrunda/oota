import { openStatus } from '../../utils/format'
import { cn } from '../../utils/cn'

export function OpenBadge({ opensAt, closesAt, className }: { opensAt: string; closesAt: string; className?: string }) {
  const s = openStatus(opensAt, closesAt)
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[14px] font-medium', s.open ? 'text-veg' : 'text-ink-2', className)}>
      <span className={cn('size-2 rounded-full', s.open ? 'bg-veg shadow-[0_0_10px_var(--veg)]' : 'bg-pewter')} aria-hidden />
      {s.label}
    </span>
  )
}
