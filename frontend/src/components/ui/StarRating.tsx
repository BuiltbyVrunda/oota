import { Star } from 'lucide-react'
import { cn } from '../../utils/cn'

/** Compact read-only rating: ★ 4.6 (128). */
export function StarRating({ value, count, size = 'md', className }: { value: number; count?: number; size?: 'sm' | 'md'; className?: string }) {
  if (!value) return <span className={cn('text-[13px] text-ink-3', className)}>New</span>
  return (
    <span className={cn('tabular inline-flex items-center gap-1 font-semibold', size === 'md' ? 'text-[15px]' : 'text-[13px]', className)}
      aria-label={`Rated ${value.toFixed(1)} out of 5${count ? ` from ${count} reviews` : ''}`}>
      <Star className={cn('fill-haldi text-haldi', size === 'md' ? 'size-4' : 'size-3.5')} aria-hidden />
      {value.toFixed(1)}
      {count !== undefined && <span className="font-normal text-ink-3">({count})</span>}
    </span>
  )
}
