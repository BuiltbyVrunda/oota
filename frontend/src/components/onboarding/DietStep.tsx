import { Flame } from 'lucide-react'
import { allergenOptions } from '../../data/flavours'
import type { DietPref, Preferences } from '../../types'
import { cn } from '../../utils/cn'
import { Chip } from '../ui/Chip'
import { DietMark } from '../ui/DietMark'
import { RangeSlider } from '../ui/RangeSlider'

const DIETS: { id: DietPref; title: string; body: string; mark?: 'veg' | 'egg' | 'vegan' }[] = [
  { id: 'any', title: 'Anything goes', body: 'Meat, fish, egg and veg' },
  { id: 'veg', title: 'Vegetarian', body: 'Veg and vegan dishes', mark: 'veg' },
  { id: 'egg', title: 'Eggetarian', body: 'Vegetarian plus egg', mark: 'egg' },
  { id: 'vegan', title: 'Vegan', body: 'No dairy, egg, meat', mark: 'vegan' },
]

type Value = Pick<Preferences, 'diet' | 'allergens' | 'spiceLevel'>

export function DietStep({ value, onChange }: { value: Value; onChange: (v: Value) => void }) {
  return (
    <div className="flex flex-col gap-8">
      <fieldset>
        <legend className="text-[16px] font-semibold">How do you eat?</legend>
        <div role="radiogroup" className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {DIETS.map((d) => {
            const on = value.diet === d.id
            return (
              <button key={d.id} type="button" role="radio" aria-checked={on} onClick={() => onChange({ ...value, diet: d.id })}
                className={cn('liquid-flat flex min-h-24 flex-col items-start gap-1 rounded-card p-4 text-left transition-[transform,box-shadow]',
                  on ? 'bg-haldi-wash shadow-[0_0_0_2px_var(--haldi)]' : 'hover:-translate-y-0.5')}>
                <span className="relative z-[2] flex items-center gap-2 text-[16px] font-semibold">
                  {d.mark && <DietMark diet={d.mark} />}{d.title}
                </span>
                <span className="relative z-[2] text-[14px] text-ink-2">{d.body}</span>
              </button>
            )
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-[16px] font-semibold">Anything you avoid?</legend>
        <p className="text-[14px] text-ink-3">Dishes with these never show up as picks.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {allergenOptions.map((a) => {
            const on = value.allergens.includes(a)
            return (
              <Chip key={a} selected={on} onClick={() => onChange({ ...value, allergens: on ? value.allergens.filter((x) => x !== a) : [...value.allergens, a] })}>
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </Chip>
            )
          })}
        </div>
      </fieldset>
      <div className="liquid-flat rounded-card p-5">
        <div className="relative z-[2] flex items-center gap-2 text-chilli" aria-hidden>
          {[0, 1, 2].map((i) => <Flame key={i} className={cn('size-5 transition-opacity', i < value.spiceLevel ? 'opacity-100' : 'opacity-25')} />)}
        </div>
        <RangeSlider className="relative z-[2] mt-2" label="How much heat?" min={0} max={3} value={value.spiceLevel}
          onChange={(n) => onChange({ ...value, spiceLevel: n as 0 | 1 | 2 | 3 })} marks={['None', 'Mild', 'Medium', 'Andhra hot']} />
      </div>
    </div>
  )
}
