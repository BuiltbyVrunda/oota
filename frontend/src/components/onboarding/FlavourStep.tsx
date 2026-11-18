import { Check } from 'lucide-react'
import { flavours } from '../../data/flavours'
import type { Flavour } from '../../types'
import { cn } from '../../utils/cn'

const HUE: Record<Flavour, string> = {
  spicy: 'from-chilli/35', tangy: 'from-leaf/30', sweet: 'from-kokum/35', creamy: 'from-coconut/25', smoky: 'from-pewter/40',
  mild: 'from-leaf/20', rich: 'from-haldi/35', fresh: 'from-leaf/35', crispy: 'from-haldi/30', comforting: 'from-kokum/25',
}

export function FlavourStep({ value, onChange }: { value: Flavour[]; onChange: (v: Flavour[]) => void }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {flavours.map((f) => {
        const on = value.includes(f.id)
        return (
          <li key={f.id}>
            <button type="button" aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== f.id) : [...value, f.id])}
              className={cn('liquid-flat relative flex h-24 w-full flex-col justify-end overflow-hidden rounded-card p-4 text-left transition-[transform,box-shadow] active:scale-[0.97]',
                on ? 'shadow-[0_0_0_2px_var(--haldi)]' : 'hover:-translate-y-0.5')}>
              <span aria-hidden className={cn('absolute inset-0 bg-gradient-to-br to-transparent transition-opacity', HUE[f.id], on ? 'opacity-100' : 'opacity-50')} />
              <span className="relative z-[2] text-[17px] font-semibold">{f.label}</span>
              <span className="relative z-[2] text-[13px] text-ink-2">{f.hint}</span>
              {on && <span className="haldi-gloss absolute right-3 top-3 z-[2] grid size-6 place-items-center rounded-full"><Check className="relative z-[2] size-3.5" strokeWidth={3} /></span>}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
