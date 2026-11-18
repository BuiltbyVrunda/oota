import { Link } from 'react-router-dom'
import { useCatalog } from '../../context/CatalogContext'
import type { Dish, Recommendation } from '../../types'
import { inr } from '../../utils/format'
import { SmartImage } from '../common/SmartImage'
import { DietMark } from '../ui/DietMark'
import { StarRating } from '../ui/StarRating'

/** Compact ranked list of trending dishes — deliberately a different shape from the restaurant rail. */
export function TrendingList({ items }: { items: Recommendation<Dish>[] }) {
  const { byId } = useCatalog()
  return (
    <ol className="flex flex-col divide-y divide-seam" aria-label="Trending dishes">
      {items.map((rec, i) => {
        const d = rec.item
        const r = byId(d.restaurantId)
        return (
          <li key={d.id}>
            <Link to={r ? `/restaurant/${r.slug}#dish-${d.id}` : '#'} className="group flex items-center gap-3 rounded-md py-2.5 hover:bg-brushed sm:px-2">
              <span className="tabular w-6 shrink-0 text-center font-display text-[20px] font-semibold text-haldi-ink">{i + 1}</span>
              <SmartImage src={d.imageUrl} alt={d.name} width={320} height={320} className="size-12 shrink-0 rounded-full ring-2 ring-seam" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-[15px] font-semibold"><DietMark diet={d.diet} />{d.name}</p>
                <p className="truncate text-[13px] text-ink-3">{r?.name} · {inr(d.price)}</p>
              </div>
              <StarRating value={d.avgRating} count={d.reviewCount} size="sm" className="shrink-0" />
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
