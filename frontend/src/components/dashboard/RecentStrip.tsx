import { Link } from 'react-router-dom'
import type { Recommendation, Restaurant, ViewEntry } from '../../types'
import { relativeTime } from '../../utils/format'
import { Rail } from '../common/Rail'
import { SmartImage } from '../common/SmartImage'
import { StarRating } from '../ui/StarRating'

/** Small pill cards — the lightest tier. */
export function RecentStrip({ items, views }: { items: Recommendation<Restaurant>[]; views: ViewEntry[] }) {
  return (
    <Rail label="Recently viewed">
      {items.map(({ item: r }) => {
        const at = views.find((v) => v.restaurantId === r.id)?.at
        return (
          <Link key={r.id} to={`/restaurant/${r.slug}`}
            className="liquid-flat group flex w-[260px] items-center gap-3 rounded-full p-1.5 pr-5 transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-plate-strong">
            <SmartImage src={r.coverUrl} alt={r.name} width={1200} height={700} className="relative z-[2] size-14 shrink-0 rounded-full" />
            <div className="relative z-[2] min-w-0">
              <p className="truncate text-[15px] font-semibold">{r.name}</p>
              <p className="flex items-center gap-2 text-[13px] text-ink-3">
                <StarRating value={r.avgRating} size="sm" className="text-ink-2" />
                {at && <span>· {relativeTime(at)}</span>}
              </p>
            </div>
          </Link>
        )
      })}
    </Rail>
  )
}
