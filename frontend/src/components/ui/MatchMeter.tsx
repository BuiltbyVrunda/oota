import { matchWord } from '../../utils/recommend'
import { cn } from '../../utils/cn'

/** The only way match strength is shown: five 14×4 bars + a word. */
export function MatchMeter({ match, compact, className }: { match: number; compact?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)} aria-label={`${matchWord(match)}, ${match} of 5`}>
      <span className="flex gap-[3px]" aria-hidden>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={cn('h-1 w-3.5 rounded-full', n <= match ? 'bg-haldi shadow-[0_0_8px_rgb(255_176_32/0.7)]' : 'bg-seam-strong')} />
        ))}
      </span>
      {!compact && <span className="text-[12px] font-semibold text-haldi-ink">{matchWord(match)}</span>}
    </span>
  )
}
