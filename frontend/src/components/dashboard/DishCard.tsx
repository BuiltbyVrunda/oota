import { Flame } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCatalog } from '../../context/CatalogContext'
import type { Dish, Recommendation } from '../../types'
import { cn } from '../../utils/cn'
import { inr } from '../../utils/format'
import { SmartImage } from '../common/SmartImage'
import { DietMark } from '../ui/DietMark'
import { MatchMeter } from '../ui/MatchMeter'
import { StarRating } from '../ui/StarRating'

/** Horizontal dish row: thumbnail, name with diet mark, where it's from, price, why. */
export function DishCard({ rec, onOpen, className }: { rec: Recommendation<Dish>; onOpen?: () => void; className?: string }) {
  const d = rec.item
  const { byId } = useCatalog()
  const r = byId(d.restaurantId)
  return (
    <Link to={r ? `/restaurant/${r.slug}#dish-${d.id}` : '#'} onClick={onOpen}
      className={cn('liquid-flat group flex items-center gap-3.5 rounded-card p-2.5 pr-4 transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-plate-strong', className)}>
      <SmartImage src={d.imageUrl} alt={d.name} width={320} height={320} className="relative z-[2] size-[76px] shrink-0 rounded-[12px]" imgClassName="transition-transform duration-500 group-hover:scale-110" />
      <div className="relative z-[2] min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <DietMark diet={d.diet} />
          <h3 className="truncate font-sans text-[16px] font-semibold tracking-normal">{d.name}</h3>
        </div>
        <p className="truncate text-[14px] text-ink-2">{r?.name} · {r?.area}</p>
        <div className="mt-1.5 flex items-center gap-3">
          <span className="tabular text-[14px] font-semibold">{inr(d.price)}</span>
          <StarRating value={d.avgRating} size="sm" />
          {d.spiceLevel > 1 && <span className="flex text-chilli" aria-label={`Spice ${d.spiceLevel} of 3`}>{Array.from({ length: d.spiceLevel }, (_, i) => <Flame key={i} className="size-3.5" aria-hidden />)}</span>}
          <MatchMeter match={rec.match} compact className="ml-auto" />
        </div>
      </div>
    </Link>
  )
}
