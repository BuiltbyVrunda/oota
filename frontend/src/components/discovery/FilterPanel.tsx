import { Star } from 'lucide-react'
import type { ReactNode } from 'react'
import { useCatalog } from '../../context/CatalogContext'
import { flavours } from '../../data/flavours'
import type { Filters } from '../../types'
import { Chip } from '../ui/Chip'
import { DietMark } from '../ui/DietMark'

const DIETS: { id: Filters['diet']; label: string; mark?: 'veg' | 'egg' | 'nonveg' | 'vegan' }[] = [
  { id: 'any', label: 'Any' }, { id: 'veg', label: 'Veg', mark: 'veg' }, { id: 'egg', label: 'Egg', mark: 'egg' },
  { id: 'nonveg', label: 'Non-veg', mark: 'nonveg' }, { id: 'vegan', label: 'Vegan', mark: 'vegan' },
]
const RATINGS = [0, 3.5, 4, 4.5]

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-b border-seam pb-5 last:border-0 last:pb-0">
      <legend className="mb-3 text-[14px] font-semibold text-ink">{title}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  )
}

export function FilterPanel({ value, onChange }: { value: Filters; onChange: (f: Filters) => void }) {
  const { cuisines } = useCatalog()
  const toggle = <T,>(arr: T[], x: T) => (arr.includes(x) ? arr.filter((a) => a !== x) : [...arr, x])
  return (
    <div className="flex flex-col gap-5">
      <Group title="Diet">
        {DIETS.map((d) => (
          <Chip key={d.id} size="sm" selected={value.diet === d.id} onClick={() => onChange({ ...value, diet: d.id })} icon={d.mark && <DietMark diet={d.mark} />}>{d.label}</Chip>
        ))}
      </Group>
      <Group title="Price">
        {[1, 2, 3, 4].map((p) => (
          <Chip key={p} size="sm" selected={value.priceLevels.includes(p)} onClick={() => onChange({ ...value, priceLevels: toggle(value.priceLevels, p) })}
            aria-label={`Price level ${p} of 4`}>
            <span className="tabular">{'₹'.repeat(p)}</span>
          </Chip>
        ))}
      </Group>
      <Group title="Rating">
        {RATINGS.map((r) => (
          <Chip key={r} size="sm" selected={value.minRating === r} onClick={() => onChange({ ...value, minRating: r })}
            icon={r ? <Star className="size-3.5 fill-current" aria-hidden /> : undefined}>
            {r ? `${r}+` : 'Any'}
          </Chip>
        ))}
      </Group>
      <Group title="Cuisine">
        {cuisines.map((c) => (
          <Chip key={c.id} size="sm" selected={value.cuisineIds.includes(c.id)} onClick={() => onChange({ ...value, cuisineIds: toggle(value.cuisineIds, c.id) })}>{c.name}</Chip>
        ))}
      </Group>
      <Group title="Flavour">
        {flavours.map((f) => (
          <Chip key={f.id} size="sm" selected={value.flavours.includes(f.id)} onClick={() => onChange({ ...value, flavours: toggle(value.flavours, f.id) })}>{f.label}</Chip>
        ))}
      </Group>
    </div>
  )
}
