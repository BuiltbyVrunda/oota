import { cn } from '../../utils/cn'

export function PriceLevel({ level, className }: { level: number; className?: string }) {
  return (
    <span className={cn('tabular text-[14px] font-semibold tracking-wide', className)} aria-label={`Price level ${level} of 4`}>
      <span className="text-ink">{'₹'.repeat(level)}</span>
      <span className="text-ink-3/50" aria-hidden>{'₹'.repeat(4 - level)}</span>
    </span>
  )
}
