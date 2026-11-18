import { Link } from 'react-router-dom'
import { useCatalog } from '../../context/CatalogContext'
import type { Recommendation, Restaurant } from '../../types'
import { inr } from '../../utils/format'
import { OpenBadge } from '../common/OpenBadge'
import { PriceLevel } from '../common/PriceLevel'
import { SaveButton } from '../common/SaveButton'
import { SmartImage } from '../common/SmartImage'
import { MatchMeter } from '../ui/MatchMeter'
import { StarRating } from '../ui/StarRating'

export function RestaurantResult({ rec, onOpen }: { rec: Recommendation<Restaurant>; onOpen: () => void }) {
  const r = rec.item
  const { cuisineById } = useCatalog()
  const cuisines = r.cuisineIds.map((c) => cuisineById(c)?.name).join(' · ')
  return (
    <Link to={`/restaurant/${r.slug}`} onClick={onOpen} data-like-surface
      className="liquid-flat group flex gap-4 rounded-card p-2.5 transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-plate-strong">
      <div data-like-origin className="relative z-[2] shrink-0">
        <SmartImage src={r.coverUrl} alt={`${r.name} in ${r.area}`} width={1200} height={700} className="h-full min-h-[132px] w-[118px] rounded-[12px] sm:w-[180px]" imgClassName="transition-transform duration-500 group-hover:scale-105" />
      </div>
      <div className="relative z-[2] flex min-w-0 flex-1 flex-col gap-1 py-1 pr-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate text-[19px] sm:text-[21px]">{r.name}</h3>
          <SaveButton restaurantId={r.id} name={r.name} className="-mr-1 -mt-1 size-10" />
        </div>
        <p className="truncate text-[14px] text-ink-2">{cuisines} · {r.area}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px]">
          <StarRating value={r.avgRating} count={r.reviewCount} />
          <PriceLevel level={r.priceLevel} />
          <span className="tabular text-ink-3">{inr(r.costForTwo)} for two</span>
        </div>
        <OpenBadge opensAt={r.opensAt} closesAt={r.closesAt} className="text-[13px]" />
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
          <MatchMeter match={rec.match} />
          <span className="truncate text-[13px] text-ink-3">{rec.reasons[0]}</span>
        </div>
      </div>
    </Link>
  )
}
