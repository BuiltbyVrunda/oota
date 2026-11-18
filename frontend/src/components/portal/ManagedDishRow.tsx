import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ManagedDish } from '../../api/portal'
import { cn } from '../../utils/cn'
import { inr } from '../../utils/format'
import { SmartImage } from '../common/SmartImage'
import { DietMark } from '../ui/DietMark'
import { StarRating } from '../ui/StarRating'
import { ConfirmButton } from './ConfirmButton'

/** One dish in a management list: availability switch, inline price edit, edit link, delete. */
export function ManagedDishRow({ d, editTo, showRestaurant, onUpdate, onDelete }: {
  d: ManagedDish; editTo?: string; showRestaurant?: boolean
  onUpdate: (patch: { price?: number; isAvailable?: boolean }) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const [price, setPrice] = useState(String(d.price))
  const [seen, setSeen] = useState(d.price)
  if (seen !== d.price) { setSeen(d.price); setPrice(String(d.price)) }
  const commitPrice = () => {
    const p = Number(price)
    if (p > 0 && p !== d.price) void onUpdate({ price: p })
    else setPrice(String(d.price))
  }
  return (
    <li className={cn('flex flex-wrap items-center gap-x-4 gap-y-2 py-3', !d.isAvailable && 'opacity-60')}>
      <SmartImage src={d.imageUrl || ''} alt={d.name} width={160} height={160} className="size-14 shrink-0 rounded-[12px]" />
      <div className="min-w-0 flex-1 basis-48">
        <p className="flex items-center gap-2 truncate text-[16px] font-semibold"><DietMark diet={d.diet} />{d.name}</p>
        <p className="truncate text-[13px] text-ink-3">
          {showRestaurant ? `${d.restaurantName} · ` : ''}{d.category} · ordered {d.timesOrdered}× · <StarRating value={d.avgRating} count={d.reviewCount} size="sm" />
        </p>
      </div>
      <label className="flex items-center gap-1.5 text-[14px]">
        <span className="text-ink-3">₹</span>
        <input type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} onBlur={commitPrice}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }} aria-label={`Price of ${d.name}, now ${inr(d.price)}`}
          className="tabular h-10 w-24 rounded-md border border-seam bg-brushed px-2.5 text-[15px] font-semibold focus:border-haldi focus-visible:outline-none" />
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-ink-2">
        <input type="checkbox" role="switch" checked={d.isAvailable} onChange={(e) => void onUpdate({ isAvailable: e.target.checked })} className="peer sr-only" />
        <span aria-hidden className={cn('relative h-6 w-10 rounded-full border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-graphite', d.isAvailable ? 'border-veg bg-veg/30' : 'border-seam bg-brushed')}>
          <span className={cn('absolute top-0.5 size-4.5 rounded-full transition-[left]', d.isAvailable ? 'left-[18px] bg-veg' : 'left-0.5 bg-ink-2')} />
        </span>
        {d.isAvailable ? 'Available' : 'Sold out'}
      </label>
      <span className="flex items-center gap-1">
        {editTo && <Link to={editTo} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-medium text-ink-2 hover:bg-brushed hover:text-ink"><Pencil className="size-3.5" aria-hidden /> Edit</Link>}
        <ConfirmButton onConfirm={onDelete} question={`Delete ${d.name}?`} />
      </span>
    </li>
  )
}
