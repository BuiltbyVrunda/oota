import { AnimatePresence, motion } from 'framer-motion'
import { Pencil, Star, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Dish, Review } from '../../types'
import { cn } from '../../utils/cn'
import { relativeTime } from '../../utils/format'
import { Button } from '../ui/Button'
import { Tabs } from '../ui/Tabs'

type Sort = 'newest' | 'highest' | 'lowest'

function Stars({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={cn('size-3.5', i <= n ? 'fill-haldi text-haldi' : 'text-seam-strong')} aria-hidden />)}
    </span>
  )
}

export function ReviewCard({ r, menu, mine, onEdit, onDelete }: { r: Review; menu: Dish[]; mine?: boolean; onEdit?: () => void; onDelete?: () => void }) {
  const dishes = r.dishRatings.map((dr) => ({ ...dr, name: menu.find((d) => d.id === dr.dishId)?.name })).filter((d) => d.name)
  return (
    <article className={cn('rounded-card p-4', mine ? 'liquid-flat shadow-[0_0_0_1.5px_var(--haldi)]' : 'border-b border-seam last:border-0')}>
      <header className="relative z-[2] flex items-center gap-3">
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-full text-[15px] font-bold', mine ? 'haldi-gloss' : 'bg-plate-strong text-ink')} aria-hidden>{r.userName.charAt(0)}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">{mine ? 'Your review' : r.userName}</p>
          <div className="flex items-center gap-2 text-[13px] text-ink-3"><Stars n={r.rating} /><span>{relativeTime(r.createdAt)}</span></div>
        </div>
        {mine && (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={onEdit} icon={<Pencil className="size-3.5" />}>Edit</Button>
            <Button size="sm" variant="ghost" onClick={onDelete} icon={<Trash2 className="size-3.5" />} aria-label="Delete your review" />
          </div>
        )}
      </header>
      <p className="measure relative z-[2] mt-3 text-[15px] leading-relaxed text-ink">{r.text}</p>
      {(dishes.length > 0 || r.tags.length > 0) && (
        <div className="relative z-[2] mt-3 flex flex-wrap gap-1.5">
          {dishes.map((d) => (
            <span key={d.dishId} className="inline-flex items-center gap-1 rounded-full bg-brushed px-2.5 py-1 text-[12px] text-ink-2">
              {d.name} <Star className="size-3 fill-haldi text-haldi" aria-hidden /><span className="tabular font-semibold text-ink">{d.rating}</span>
            </span>
          ))}
          {r.tags.map((t) => <span key={t} className="rounded-full border border-seam px-2.5 py-1 text-[12px] text-ink-3">{t}</span>)}
        </div>
      )}
    </article>
  )
}

export function ReviewList({ reviews, menu, excludeId }: { reviews: Review[]; menu: Dish[]; excludeId?: string }) {
  const [sort, setSort] = useState<Sort>('newest')
  const [all, setAll] = useState(false)
  const sorted = useMemo(() => {
    const list = reviews.filter((r) => r.id !== excludeId)
    return [...list].sort((a, b) =>
      sort === 'newest' ? b.createdAt.localeCompare(a.createdAt) : sort === 'highest' ? b.rating - a.rating || b.createdAt.localeCompare(a.createdAt) : a.rating - b.rating || b.createdAt.localeCompare(a.createdAt))
  }, [reviews, sort, excludeId])
  const shown = all ? sorted : sorted.slice(0, 5)
  return (
    <div>
      <Tabs label="Sort reviews" size="sm" value={sort} onChange={setSort}
        items={[{ key: 'newest', label: 'Newest' }, { key: 'highest', label: 'Highest' }, { key: 'lowest', label: 'Lowest' }]} />
      <motion.div layout className="mt-4 flex flex-col">
        <AnimatePresence initial={false} mode="popLayout">
          {shown.map((r) => (
            <motion.div key={r.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 34 }}>
              <ReviewCard r={r} menu={menu} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      {sorted.length > 5 && (
        <Button variant="secondary" className="mt-3" onClick={() => setAll((a) => !a)}>{all ? 'Show fewer' : `Show all ${sorted.length} reviews`}</Button>
      )}
    </div>
  )
}
