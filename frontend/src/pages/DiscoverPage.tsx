import { AnimatePresence, motion } from 'framer-motion'
import { SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ActiveFilters } from '../components/discovery/ActiveFilters'
import { DishResult } from '../components/discovery/DishResult'
import { FilterPanel } from '../components/discovery/FilterPanel'
import { NoResults } from '../components/discovery/NoResults'
import { RestaurantResult } from '../components/discovery/RestaurantResult'
import { ResultTabs, type ResultTab } from '../components/discovery/ResultTabs'
import { SearchField, type Suggestion } from '../components/discovery/SearchField'
import { PageContainer } from '../components/layout/PageContainer'
import { Button } from '../components/ui/Button'
import { IconButton } from '../components/ui/IconButton'
import { useActivity } from '../context/ActivityContext'
import { useCatalog } from '../context/CatalogContext'
import { useDiscovery } from '../hooks/useDiscovery'
import { flavourLabel } from '../data/flavours'
import type { Filters } from '../types'
import { activeFilterCount, defaultFilters } from '../utils/filter'
import { plural } from '../utils/format'

const reorder = { type: 'spring' as const, stiffness: 380, damping: 34 }

export function DiscoverPage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { cuisines, cuisineById } = useCatalog()
  const { recordSearch } = useActivity()

  const [query, setQuery] = useState(() => params.get('q') ?? '')
  const [tab, setTab] = useState<ResultTab>(() => (params.get('tab') === 'dishes' ? 'dishes' : 'restaurants'))
  const [filters, setFilters] = useState<Filters>(() => {
    const slugs = params.getAll('cuisine')
    return { ...defaultFilters, cuisineIds: cuisines.filter((c) => slugs.includes(c.slug)).map((c) => c.id) }
  })
  const [sheet, setSheet] = useState(false)

  // keep ?cuisine= / ?q= deep links in sync when the URL changes (e.g. clicking a cuisine tile while already here)
  const paramKey = `${params.getAll('cuisine').join(',')}|${params.get('q') ?? ''}`
  const [seenParams, setSeenParams] = useState(paramKey)
  if (seenParams !== paramKey) {
    setSeenParams(paramKey)
    const slugs = params.getAll('cuisine')
    if (slugs.length) setFilters((f) => ({ ...f, cuisineIds: cuisines.filter((c) => slugs.includes(c.slug)).map((c) => c.id) }))
    if (params.get('q') !== null) setQuery(params.get('q') ?? '')
  }

  const res = useDiscovery(query, filters, tab)
  const count = activeFilterCount(filters)
  const list = tab === 'restaurants' ? res.restaurants : res.dishes

  const record = (q: string, clickedRestaurantId?: number) => {
    if (!q.trim()) return
    recordSearch({ query: q, filters: { ...filters }, ...(clickedRestaurantId ? { clickedRestaurantId } : {}) })
  }
  const submit = (q: string) => {
    record(q)
    setParams((p) => { const n = new URLSearchParams(p); if (q.trim()) n.set('q', q.trim()); else n.delete('q'); n.delete('focus'); return n }, { replace: true })
  }
  const pick = (s: Suggestion) => {
    if (s.kind === 'recent') { setQuery(s.label); submit(s.label) }
    else if (s.kind === 'cuisine') { setQuery(''); setFilters((f) => ({ ...f, cuisineIds: f.cuisineIds.includes(s.id) ? f.cuisineIds : [...f.cuisineIds, s.id] })); record(s.label) }
    else if (s.kind === 'dish') { setQuery(s.label); setTab('dishes'); submit(s.label) }
    else { record(query || s.label, s.id); navigate(`/restaurant/${s.slug}`) }
  }

  const narrow = useMemo(() => {
    const out: string[] = []
    if (res.settledQuery.trim()) out.push(`“${res.settledQuery.trim()}”`)
    filters.cuisineIds.forEach((id) => out.push(cuisineById(id)?.name ?? ''))
    if (filters.diet !== 'any') out.push(filters.diet === 'nonveg' ? 'non-veg' : filters.diet)
    if (filters.priceLevels.length) out.push(filters.priceLevels.map((p) => '₹'.repeat(p)).join('/'))
    if (filters.minRating) out.push(`${filters.minRating}★+`)
    filters.flavours.forEach((f) => out.push(flavourLabel(f).toLowerCase()))
    return out.filter(Boolean)
  }, [res.settledQuery, filters, cuisineById])

  return (
    <PageContainer className="pt-6 sm:pt-10">
      <h1 className="text-[34px] sm:text-[48px]">Discover</h1>
      <p className="mt-1 text-[16px] text-ink-2">Every restaurant and dish in Oota, ranked for you as you type.</p>

      <div className="mt-6 flex items-center gap-3">
        <div className="min-w-0 flex-1"><SearchField value={query} onChange={setQuery} onSubmit={submit} onPick={pick} autoFocus={params.get('focus') === '1'} /></div>
        <Button variant="secondary" className="h-16 shrink-0 px-4 lg:hidden" onClick={() => setSheet(true)} icon={<SlidersHorizontal className="size-4" />} aria-label={`Filters${count ? `, ${count} active` : ''}`}>
          <span className="hidden sm:inline">Filters</span>
          {count > 0 && <span className="tabular grid size-6 place-items-center rounded-full bg-haldi text-[12px] font-bold text-on-haldi">{count}</span>}
        </Button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside aria-label="Filters" className="hidden lg:block">
          <div className="liquid tint-leaf sticky top-28 max-h-[calc(100dvh-8rem)] overflow-y-auto rounded-tier p-5">
            <div className="relative z-[2]">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-[20px]">Filters</h2>
                {count > 0 && <button type="button" onClick={() => setFilters({ ...defaultFilters, sort: filters.sort })} className="h-8 rounded-full px-3 text-[13px] font-semibold text-haldi-ink hover:bg-haldi-wash">Reset</button>}
              </div>
              <FilterPanel value={filters} onChange={setFilters} />
            </div>
          </div>
        </aside>

        <section aria-label="Results" className="flex min-w-0 flex-col gap-4">
          <ResultTabs tab={tab} onTab={setTab} counts={{ restaurants: res.restaurants.length, dishes: res.dishes.length }} sort={filters.sort} onSort={(sort) => setFilters({ ...filters, sort })} />
          <ActiveFilters value={filters} onChange={setFilters} query={res.settledQuery} onClearQuery={() => { setQuery(''); setParams((p) => { const n = new URLSearchParams(p); n.delete('q'); return n }, { replace: true }) }} />
          <p className="sr-only" aria-live="polite">{plural(list.length, tab === 'restaurants' ? 'restaurant' : 'dish', tab === 'restaurants' ? 'restaurants' : 'dishes')} found</p>

          {list.length === 0 ? (
            <div className="liquid rounded-tier">
              <div className="relative z-[2]">
                <NoResults tab={tab} narrow={narrow} relax={res.relax}
                  onRelax={() => { if (res.relax) { setFilters(res.relax.next); setQuery(res.relax.q) } }}
                  onPopular={(q) => { setFilters({ ...defaultFilters, sort: filters.sort }); setQuery(q); submit(q) }} />
              </div>
            </div>
          ) : tab === 'restaurants' ? (
            <motion.ul className="flex flex-col gap-3">
              <AnimatePresence initial={false} mode="popLayout">
                {res.restaurants.map((r) => (
                  <motion.li key={r.item.id} layout="position" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={reorder}>
                    <RestaurantResult rec={r} onOpen={() => record(query, r.item.id)} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          ) : (
            <motion.ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence initial={false} mode="popLayout">
                {res.dishes.slice(0, 60).map((d) => (
                  <motion.li key={d.item.id} layout="position" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={reorder}>
                    <DishResult rec={d} onOpen={() => record(query, d.item.restaurantId)} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
          {tab === 'dishes' && res.dishes.length > 60 && <p className="text-center text-[14px] text-ink-3">Showing the 60 best matches of {res.dishes.length}. Narrow it down with filters.</p>}
        </section>
      </div>

      <FilterSheet open={sheet} onClose={() => setSheet(false)} resultCount={list.length} tab={tab}>
        <FilterPanel value={filters} onChange={setFilters} />
      </FilterSheet>
    </PageContainer>
  )
}

/** Mobile bottom sheet for filters (inline panel on desktop). */
function FilterSheet({ open, onClose, resultCount, tab, children }: { open: boolean; onClose: () => void; resultCount: number; tab: ResultTab; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div className="absolute inset-0 bg-graphite/30" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div role="dialog" aria-label="Filters" className="liquid liquid-strong absolute inset-x-0 bottom-0 flex max-h-[86dvh] flex-col rounded-t-tier"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.4 }} onDragEnd={(_, i) => { if (i.offset.y > 120) onClose() }}>
            <div className="relative z-[2] flex items-center justify-between px-5 pb-2 pt-3">
              <span aria-hidden className="absolute left-1/2 top-2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-seam-strong" />
              <h2 className="mt-3 text-[22px]">Filters</h2>
              <IconButton label="Close filters" onClick={onClose} size="sm" className="mt-3"><X className="size-4" /></IconButton>
            </div>
            <div className="relative z-[2] flex-1 overflow-y-auto px-5 py-3">{children}</div>
            <div className="relative z-[2] border-t border-seam p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
              <Button full size="lg" variant="accent" onClick={onClose}>Show {plural(resultCount, tab === 'restaurants' ? 'restaurant' : 'dish', tab === 'restaurants' ? 'restaurants' : 'dishes')}</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
