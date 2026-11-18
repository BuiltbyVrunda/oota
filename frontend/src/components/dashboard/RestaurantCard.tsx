import { Link } from 'react-router-dom'
import { useCatalog } from '../../context/CatalogContext'
import type { Recommendation, Restaurant } from '../../types'
import { cn } from '../../utils/cn'
import { PriceLevel } from '../common/PriceLevel'
import { SaveButton } from '../common/SaveButton'
import { SmartImage } from '../common/SmartImage'
import { MatchMeter } from '../ui/MatchMeter'
import { StarRating } from '../ui/StarRating'

type Variant = 'portrait' | 'wide' | 'feature' | 'grid'

const frame: Record<Variant, string> = {
  portrait: 'w-[78vw] max-w-[300px] aspect-[4/5]',
  wide: 'w-[86vw] max-w-[440px] aspect-[16/10] [.col-span-2>&]:w-full [.col-span-2>&]:max-w-none',
  feature: 'w-full aspect-[4/5] sm:aspect-[16/11] lg:aspect-auto lg:h-full lg:min-h-[420px]',
  grid: 'w-full aspect-[4/5]',
}

/** Photo-first card with a liquid-glass caption floating over the photo. */
export function RestaurantCard({ rec, variant = 'portrait', eager, onOpen }: { rec: Recommendation<Restaurant>; variant?: Variant; eager?: boolean; onOpen?: () => void }) {
  const r = rec.item
  const { cuisineById } = useCatalog()
  const cuisines = r.cuisineIds.map((c) => cuisineById(c)?.name).filter(Boolean).join(' · ')
  return (
    <Link to={`/restaurant/${r.slug}`} onClick={onOpen}
      className={cn('frost-mat group block rounded-[20px] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-e3', frame[variant])}>
      <div className="relative size-full overflow-hidden rounded-[14px]">
      <SmartImage src={r.coverUrl} alt={`${r.name}, ${cuisines} in ${r.area}`} width={1200} height={700} eager={eager}
        className="absolute inset-0" imgClassName="transition-transform duration-700 group-hover:scale-[1.06]" />
      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-graphite/80 via-graphite/5 to-graphite/10" />
      <span className="absolute right-3 top-3 z-[3]"><SaveButton restaurantId={r.id} name={r.name} /></span>
      {r.isPureVeg && (
        <span className="liquid-chip absolute left-3 top-3 z-[3] inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold text-veg">
          <span className="relative z-[2] size-2 rounded-full bg-veg" aria-hidden /><span className="relative z-[2]">Pure veg</span>
        </span>
      )}
      <div className={cn('liquid-chip absolute inset-x-2.5 bottom-2.5 z-[3] rounded-[14px] p-3.5', variant === 'feature' && 'sm:inset-x-4 sm:bottom-4 sm:p-5')}>
        <div className="relative z-[2]">
          <div className="flex items-start justify-between gap-3">
            <h3 className={cn('min-w-0 truncate', variant === 'feature' ? 'text-[22px] sm:text-[30px]' : 'text-[19px]')}>{r.name}</h3>
            <StarRating value={r.avgRating} className="shrink-0 pt-0.5" />
          </div>
          <p className="mt-0.5 truncate text-[14px] text-ink-2">{cuisines} · {r.area}</p>
          <div className="mt-2.5 flex items-center justify-between gap-3">
            <MatchMeter match={rec.match} />
            <PriceLevel level={r.priceLevel} />
          </div>
          <p className="mt-2 line-clamp-1 text-[13px] text-ink-2">{rec.reasons[0]}</p>
          {variant === 'feature' && rec.reasons[1] && <p className="line-clamp-1 text-[13px] text-ink-3">{rec.reasons[1]}</p>}
        </div>
      </div>
      </div>
    </Link>
  )
}
