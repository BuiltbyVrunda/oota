import { Check } from 'lucide-react'
import { cuisines } from '../../data/cuisines'
import { cn } from '../../utils/cn'
import { SmartImage } from '../common/SmartImage'

export function CuisineStep({ value, onChange, min = 3 }: { value: number[]; onChange: (v: number[]) => void; min?: number }) {
  const toggle = (id: number) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])
  return (
    <div>
      <p className="text-[14px] text-ink-2" aria-live="polite">
        <span className={cn('font-semibold', value.length >= min ? 'text-haldi-ink' : 'text-ink')}>{value.length} picked</span>
        {value.length < min ? ` · pick at least ${min - value.length} more` : ' · nice, pick as many as you like'}
      </p>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cuisines.map((c) => {
          const on = value.includes(c.id)
          return (
            <li key={c.id}>
              <button type="button" aria-pressed={on} onClick={() => toggle(c.id)}
                className={cn('group relative block aspect-[4/5] w-full overflow-hidden rounded-card text-left transition-[transform,box-shadow] duration-200 active:scale-[0.97]',
                  on ? 'shadow-[0_0_0_2px_var(--haldi),0_12px_30px_-10px_rgb(255_176_32/0.6)]' : 'shadow-e2 hover:-translate-y-0.5')}>
                <SmartImage src={c.imageUrl} alt="" width={480} height={600} className="absolute inset-0" imgClassName="transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute inset-0 bg-gradient-to-t from-graphite/90 via-graphite/20 to-transparent" />
                <span className="absolute inset-x-2 bottom-2 rounded-md px-2 py-1.5 text-[15px] font-semibold text-shadow-photo">{c.name}</span>
                <span className={cn('absolute right-2 top-2 grid size-7 place-items-center rounded-full transition-all',
                  on ? 'haldi-gloss scale-100' : 'liquid-chip scale-90 text-transparent')}>
                  <Check className="relative z-[2] size-4" strokeWidth={3} aria-hidden />
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
