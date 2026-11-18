import { Clock, MapPin } from 'lucide-react'
import type { Restaurant } from '../../types'
import { cn } from '../../utils/cn'
import { fmtTime, inr } from '../../utils/format'
import { OpenBadge } from '../common/OpenBadge'
import { PriceLevel } from '../common/PriceLevel'
import { StarRating } from '../ui/StarRating'

export function MetaRow({ r, className }: { r: Restaurant; className?: string }) {
  return (
    <dl className={cn('flex flex-wrap items-center gap-x-6 gap-y-3 text-[14px]', className)}>
      <div className="flex items-center gap-2"><dt className="sr-only">Rating</dt><dd><StarRating value={r.avgRating} count={r.reviewCount} /></dd></div>
      <div className="flex items-center gap-2"><dt className="sr-only">Price</dt><dd className="flex items-center gap-2"><PriceLevel level={r.priceLevel} /><span className="tabular text-ink-2">{inr(r.costForTwo)} for two</span></dd></div>
      <div className="flex items-center gap-2"><dt className="sr-only">Area</dt><dd className="flex items-center gap-1.5 text-ink-2"><MapPin className="size-4 text-pewter" aria-hidden />{r.area}</dd></div>
      <div className="flex items-center gap-2">
        <dt className="sr-only">Hours</dt>
        <dd className="flex flex-wrap items-center gap-2 text-ink-2"><Clock className="size-4 text-pewter" aria-hidden />{fmtTime(r.opensAt)}–{fmtTime(r.closesAt)}<OpenBadge opensAt={r.opensAt} closesAt={r.closesAt} /></dd>
      </div>
    </dl>
  )
}
