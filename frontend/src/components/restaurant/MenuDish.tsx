import { Flame } from 'lucide-react'
import { flavourLabel } from '../../data/flavours'
import type { Dish } from '../../types'
import { cn } from '../../utils/cn'
import { inr } from '../../utils/format'
import { SmartImage } from '../common/SmartImage'
import { DietMark } from '../ui/DietMark'
import { StarRating } from '../ui/StarRating'

export function MenuDish({ d, highlighted, eager }: { d: Dish; highlighted?: boolean; eager?: boolean }) {
  return (
    <article id={`dish-${d.id}`} aria-labelledby={`dish-${d.id}-name`}
      className={cn('flex gap-4 rounded-card p-3 transition-[background-color,box-shadow] duration-500 sm:gap-5', highlighted ? 'bg-haldi-wash shadow-[0_0_0_2px_var(--haldi)]' : 'hover:bg-brushed')}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <DietMark diet={d.diet} />
          {d.spiceLevel > 0 && (
            <span className="flex text-chilli" aria-label={`Spice level ${d.spiceLevel} of 3`}>
              {[1, 2, 3].map((n) => <Flame key={n} className={cn('size-3.5', n > d.spiceLevel && 'opacity-25')} aria-hidden />)}
            </span>
          )}
        </div>
        <h3 id={`dish-${d.id}-name`} className="mt-1 font-sans text-[17px] font-semibold tracking-normal">{d.name}</h3>
        <div className="mt-0.5 flex items-center gap-3">
          <span className="tabular text-[16px] font-semibold">{inr(d.price)}</span>
          <StarRating value={d.avgRating} count={d.reviewCount} size="sm" />
        </div>
        <p className="mt-1.5 line-clamp-2 text-[14px] text-ink-2 sm:line-clamp-none">{d.description}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {d.flavourTags.map((f) => <span key={f} className="rounded-full border border-seam px-2.5 py-0.5 text-[12px] text-ink-2">{flavourLabel(f)}</span>)}
          {d.allergens.length > 0 && <span className="px-1 py-0.5 text-[12px] text-ink-3">Contains {d.allergens.join(', ')}</span>}
        </div>
      </div>
      <SmartImage src={d.imageUrl} alt={d.name} width={320} height={320} eager={eager} className="size-24 shrink-0 rounded-[14px] shadow-e2 sm:size-32" />
    </article>
  )
}
