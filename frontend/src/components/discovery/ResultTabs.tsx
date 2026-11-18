import type { Filters } from '../../types'
import { Select } from '../ui/Select'
import { Tabs } from '../ui/Tabs'

export type ResultTab = 'restaurants' | 'dishes'

export function ResultTabs({ tab, onTab, counts, sort, onSort }: { tab: ResultTab; onTab: (t: ResultTab) => void; counts: Record<ResultTab, number>; sort: Filters['sort']; onSort: (s: Filters['sort']) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Tabs label="Result type" value={tab} onChange={onTab}
        items={[{ key: 'restaurants', label: 'Restaurants', count: counts.restaurants }, { key: 'dishes', label: 'Dishes', count: counts.dishes }]} />
      <Select label="Sort" value={sort} onChange={(e) => onSort(e.target.value as Filters['sort'])}
        options={[{ value: 'match', label: 'Best match' }, { value: 'rating', label: 'Rating' }, { value: 'price', label: 'Price: low to high' }]} />
    </div>
  )
}
