import { AnimatePresence, motion } from 'framer-motion'
import { useCatalog } from '../../context/CatalogContext'
import { flavourLabel } from '../../data/flavours'
import type { Filters } from '../../types'
import { defaultFilters } from '../../utils/filter'
import { Chip } from '../ui/Chip'

const DIET_LABEL = { any: 'Any diet', veg: 'Veg', egg: 'Egg', nonveg: 'Non-veg', vegan: 'Vegan' } as const

export function ActiveFilters({ value, onChange, query, onClearQuery }: { value: Filters; onChange: (f: Filters) => void; query: string; onClearQuery: () => void }) {
  const { cuisineById } = useCatalog()
  const chips: { key: string; label: string; remove: () => void }[] = []
  if (query.trim()) chips.push({ key: 'q', label: `“${query.trim()}”`, remove: onClearQuery })
  value.cuisineIds.forEach((id) => chips.push({ key: `c${id}`, label: cuisineById(id)?.name ?? 'Cuisine', remove: () => onChange({ ...value, cuisineIds: value.cuisineIds.filter((x) => x !== id) }) }))
  if (value.diet !== 'any') chips.push({ key: 'diet', label: DIET_LABEL[value.diet], remove: () => onChange({ ...value, diet: 'any' }) })
  value.priceLevels.forEach((p) => chips.push({ key: `p${p}`, label: '₹'.repeat(p), remove: () => onChange({ ...value, priceLevels: value.priceLevels.filter((x) => x !== p) }) }))
  if (value.minRating) chips.push({ key: 'r', label: `${value.minRating}★ and up`, remove: () => onChange({ ...value, minRating: 0 }) })
  value.flavours.forEach((f) => chips.push({ key: `f${f}`, label: flavourLabel(f), remove: () => onChange({ ...value, flavours: value.flavours.filter((x) => x !== f) }) }))
  if (!chips.length) return null
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
      <AnimatePresence initial={false}>
        {chips.map((c) => (
          <motion.span key={c.key} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
            <Chip size="sm" selected onRemove={c.remove}>{c.label}</Chip>
          </motion.span>
        ))}
      </AnimatePresence>
      <button type="button" onClick={() => { onChange({ ...defaultFilters, sort: value.sort }); onClearQuery() }}
        className="h-8 rounded-full px-3 text-[13px] font-semibold text-haldi-ink hover:bg-haldi-wash">Clear all</button>
    </div>
  )
}
