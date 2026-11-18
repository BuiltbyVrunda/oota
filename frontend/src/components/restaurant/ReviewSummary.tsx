import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import type { Review } from '../../types'
import { plural } from '../../utils/format'

export function ReviewSummary({ reviews, avg }: { reviews: Review[]; avg: number }) {
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: reviews.filter((r) => r.rating === n).length }))
  const max = Math.max(1, ...dist.map((d) => d.c))
  return (
    <div className="flex items-center gap-6">
      <div className="text-center">
        <p className="tabular font-display text-[56px] font-semibold leading-none">{avg ? avg.toFixed(1) : '—'}</p>
        <div className="mt-2 flex justify-center gap-0.5" aria-hidden>
          {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={n <= Math.round(avg) ? 'size-4 fill-haldi text-haldi' : 'size-4 text-seam-strong'} />)}
        </div>
        <p className="mt-1 text-[13px] text-ink-3">{plural(reviews.length, 'review')}</p>
      </div>
      <ul className="flex flex-1 flex-col gap-1.5" aria-label="Rating distribution">
        {dist.map(({ n, c }) => (
          <li key={n} className="flex items-center gap-2 text-[13px]">
            <span className="tabular w-3 text-ink-2">{n}</span>
            <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-brushed">
              <motion.span className="absolute inset-y-0 left-0 rounded-full bg-haldi" initial={{ width: 0 }} animate={{ width: `${(c / max) * 100}%` }} transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }} />
            </span>
            <span className="tabular w-5 text-right text-ink-3" aria-label={`${c} reviews with ${n} stars`}>{c}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
