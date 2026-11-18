import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cuisineHue } from '../../data/cuisines'
import type { Cuisine } from '../../types'
import { cn } from '../../utils/cn'
import { SmartImage } from '../common/SmartImage'

const HUE = { haldi: 'from-haldi/70', chilli: 'from-chilli/70', leaf: 'from-leaf/60', kokum: 'from-kokum/70', coconut: 'from-coconut/60' } as const

export function CuisineTiles({ items }: { items: Cuisine[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((c, i) => (
        <li key={c.id} className={cn(i === 0 && items.length >= 5 && 'col-span-2 row-span-2 sm:col-span-1 sm:row-span-1 lg:col-span-2 lg:row-span-2')}>
          <Link to={`/discover?cuisine=${c.slug}`} className="frost-mat group block aspect-square h-full w-full rounded-[20px] transition-transform hover:-translate-y-1">
            <span className="relative block size-full overflow-hidden rounded-[14px]">
            <SmartImage src={c.imageUrl} alt="" width={480} height={600} className="absolute inset-0" imgClassName="transition-transform duration-700 group-hover:scale-110" />
            <span aria-hidden className={cn('absolute inset-0 bg-gradient-to-tr via-transparent to-transparent mix-blend-multiply', HUE[cuisineHue[c.slug] ?? 'haldi'])} />
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-graphite/75 to-transparent" />
            <span className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
              <span className={cn('font-display font-semibold leading-tight text-shadow-photo', i === 0 && items.length >= 5 ? 'text-[26px] lg:text-[34px]' : 'text-[18px]')}>{c.name}</span>
              <span className="liquid-chip grid size-9 shrink-0 place-items-center rounded-full transition-transform group-hover:rotate-45">
                <ArrowUpRight className="relative z-[2] size-4" aria-hidden />
              </span>
            </span>
            </span>
            <span className="sr-only">Explore {c.name} restaurants</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
