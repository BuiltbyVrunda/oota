import { AnimatePresence, motion } from 'framer-motion'
import { History, Search, Store, UtensilsCrossed, X, Soup } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useActivity } from '../../context/ActivityContext'
import { useCatalog } from '../../context/CatalogContext'
import { textMatches } from '../../utils/recommend'
import { cn } from '../../utils/cn'

export type Suggestion =
  | { kind: 'recent'; label: string }
  | { kind: 'cuisine'; label: string; id: number }
  | { kind: 'dish'; label: string; sub: string }
  | { kind: 'restaurant'; label: string; sub: string; id: number; slug: string }

interface Props { value: string; onChange: (v: string) => void; onSubmit: (q: string) => void; onPick: (s: Suggestion) => void; autoFocus?: boolean }

const ICON: Record<Suggestion['kind'], ReactNode> = {
  recent: <History className="size-4" />, cuisine: <Soup className="size-4" />, dish: <UtensilsCrossed className="size-4" />, restaurant: <Store className="size-4" />,
}
const HEAD: Record<Suggestion['kind'], string> = { recent: 'Recent searches', cuisine: 'Cuisines', dish: 'Dishes', restaurant: 'Restaurants' }

/** Combobox: recent searches, matching cuisines, dishes and restaurants. Arrow keys + Enter, Esc closes. */
export function SearchField({ value, onChange, onSubmit, onPick, autoFocus }: Props) {
  const { searches } = useActivity()
  const { cuisines, dishes, restaurants, byId } = useCatalog()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => { if (autoFocus) inputRef.current?.focus() }, [autoFocus])
  useEffect(() => {
    const onDown = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [])

  const items = useMemo<Suggestion[]>(() => {
    const q = value.trim()
    const recent = [...new Set(searches.map((s) => s.query))]
      .filter((s) => !q || s.toLowerCase().includes(q.toLowerCase()))
      .slice(0, q ? 2 : 5)
      .map((label) => ({ kind: 'recent' as const, label }))
    if (!q) return recent
    const seenDish = new Set<string>()
    return [
      ...recent,
      ...cuisines.filter((c) => textMatches(q, c.name)).slice(0, 3).map((c) => ({ kind: 'cuisine' as const, label: c.name, id: c.id })),
      ...dishes.filter((d) => textMatches(q, d.name) && !seenDish.has(d.name) && seenDish.add(d.name)).slice(0, 4)
        .map((d) => ({ kind: 'dish' as const, label: d.name, sub: byId(d.restaurantId)?.name ?? '' })),
      ...restaurants.filter((r) => textMatches(q, `${r.name} ${r.area}`)).slice(0, 3)
        .map((r) => ({ kind: 'restaurant' as const, label: r.name, sub: r.area, id: r.id, slug: r.slug })),
    ]
  }, [value, searches, cuisines, dishes, restaurants, byId])

  const show = open && items.length > 0

  const pick = (s: Suggestion) => { setOpen(false); onPick(s) }
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(items.length - 1, a + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(-1, a - 1)) }
    else if (e.key === 'Escape') { if (open) { e.preventDefault(); setOpen(false) } }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (show && active >= 0) pick(items[active])
      else { setOpen(false); onSubmit(value) }
    }
  }

  let lastKind: Suggestion['kind'] | null = null
  return (
    <div ref={wrap} className="relative">
      <div className="liquid-chip flex h-16 items-center gap-3 rounded-full pl-5 pr-2 focus-within:shadow-[0_0_0_2px_var(--haldi),var(--e2)]">
        <Search className="relative z-[2] size-5 shrink-0 text-haldi" aria-hidden />
        <input ref={inputRef} type="search" role="combobox" aria-expanded={show} aria-controls={listId} aria-autocomplete="list"
          aria-activedescendant={show && active >= 0 ? `${listId}-${active}` : undefined} aria-label="Search dishes, restaurants or cuisines"
          placeholder="Search ghee roast, ramen, Koramangala…" value={value}
          onChange={(e) => { onChange(e.target.value); setActive(-1); setOpen(true) }} onFocus={() => setOpen(true)} onKeyDown={onKey}
          className="relative z-[2] h-full min-w-0 flex-1 bg-transparent text-[17px] text-ink outline-none focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden" />
        {value && (
          <button type="button" aria-label="Clear search" onClick={() => { onChange(''); inputRef.current?.focus() }}
            className="relative z-[2] grid size-11 place-items-center rounded-full text-pewter hover:bg-brushed hover:text-ink"><X className="size-4" /></button>
        )}
      </div>
      <AnimatePresence>
        {show && (
          <motion.ul id={listId} role="listbox" aria-label="Suggestions"
            initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.16 }}
            className="liquid liquid-strong absolute inset-x-0 top-[calc(100%+8px)] z-40 max-h-[60vh] overflow-y-auto rounded-card p-2">
            {items.map((s, i) => {
              const header = s.kind !== lastKind ? HEAD[s.kind] : null
              lastKind = s.kind
              return (
                <li key={`${s.kind}-${s.label}-${i}`} role="presentation" className="relative z-[2]">
                  {header && <p className="px-3 pb-1 pt-2 text-[12px] font-semibold text-ink-3" aria-hidden>{header}</p>}
                  <div id={`${listId}-${i}`} role="option" aria-selected={active === i} onMouseEnter={() => setActive(i)} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(s)}
                    className={cn('flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 py-2', active === i ? 'bg-haldi-wash text-ink' : 'text-ink-2')}>
                    <span className={cn(active === i ? 'text-haldi' : 'text-pewter')} aria-hidden>{ICON[s.kind]}</span>
                    <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-ink">{s.label}</span>
                    {'sub' in s && <span className="truncate text-[13px] text-ink-3">{s.sub}</span>}
                  </div>
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
