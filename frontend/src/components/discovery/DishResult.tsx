import { Flame } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCatalog } from '../../context/CatalogContext'
import { flavourLabel } from '../../data/flavours'
import type { Dish, Recommendation } from '../../types'
import { inr } from '../../utils/format'
import { SmartImage } from '../common/SmartImage'
import { DietMark } from '../ui/DietMark'
import { MatchMeter } from '../ui/MatchMeter'
import { StarRating } from '../ui/StarRating'

export function DishResult({ rec, onOpen }: { rec: Recommendation<Dish>; onOpen: () => void }) {
  const d = rec.item
  const { byId } = useCatalog()
  const r = byId(d.restaurantId)
  return (
    <Link to={r ? `/restaurant/${r.slug}#dish-${d.id}` : '#'} onClick={onOpen}
      className="liquid-flat group flex h-full flex-col overflow-hidden rounded-card transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-plate-strong">
      <SmartImage src={d.imageUrl} alt={d.name} width={320} height={320} className="relative z-[2] aspect-[16/10] w-full" imgClassName="transition-transform duration-500 group-hover:scale-105" />
      <div className="relative z-[2] flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-start gap-2">
          <DietMark diet={d.diet} className="mt-1" />
          <h3 className="min-w-0 flex-1 font-sans text-[17px] font-semibold leading-snug tracking-normal">{d.name}</h3>
          <span className="tabular shrink-0 text-[16px] font-semibold">{inr(d.price)}</span>
        </div>
        <p className="text-[14px] text-ink-2">{r?.name} · {r?.area}</p>
        <p className="line-clamp-2 text-[14px] text-ink-3">{d.description}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px]">
          <StarRating value={d.avgRating} count={d.reviewCount} size="sm" />
          {d.spiceLevel > 0 && <span className="flex text-chilli" aria-label={`Spice ${d.spiceLevel} of 3`}>{Array.from({ length: d.spiceLevel }, (_, i) => <Flame key={i} className="size-3.5" aria-hidden />)}</span>}
          {d.flavourTags.slice(0, 2).map((f) => <span key={f} className="rounded-full bg-brushed px-2 py-0.5 text-ink-2">{flavourLabel(f)}</span>)}
        </div>
        <div className="mt-auto flex items-center gap-3 pt-2">
          <MatchMeter match={rec.match} />
          <span className="truncate text-[13px] text-ink-3">{rec.reasons[0]}</span>
        </div>
      </div>
    </Link>
  )
}
