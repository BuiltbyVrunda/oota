import { motion } from 'framer-motion'
import { useRef, type PointerEvent } from 'react'
import { LIKE_EVENT, type LikeEventDetail } from '../../context/LikeBurstContext'
import { Star } from 'lucide-react'
import { useCatalog } from '../../context/CatalogContext'
import type { Restaurant } from '../../types'
import { SaveButton } from '../common/SaveButton'
import { SmartImage } from '../common/SmartImage'
import { Button } from '../ui/Button'
import { DietMark } from '../ui/DietMark'
import { MetaRow } from './MetaRow'

export function CoverHeader({ r, onRate, hasReview }: { r: Restaurant; onRate: () => void; hasReview: boolean }) {
  const { cuisineById } = useCatalog()
  const cuisines = r.cuisineIds.map((c) => cuisineById(c)?.name).join(' · ')
  // double-tap (touch) / double-click (mouse) the cover to like, like a photo feed
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null)
  const onPointerUp = (e: PointerEvent) => {
    const now = performance.now()
    const prev = lastTap.current
    if (prev && now - prev.t < 320 && Math.hypot(e.clientX - prev.x, e.clientY - prev.y) < 40) {
      lastTap.current = null
      window.dispatchEvent(new CustomEvent<LikeEventDetail>(LIKE_EVENT, { detail: { restaurantId: r.id, x: e.clientX, y: e.clientY } }))
    } else lastTap.current = { t: now, x: e.clientX, y: e.clientY }
  }
  return (
    <header className="relative" data-like-surface>
      <div className="grid grid-cols-1 gap-3 lg:h-[460px] lg:grid-cols-[minmax(0,1fr)_260px]">
        <motion.div initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
          data-like-origin onPointerUp={onPointerUp} title="Double-tap to save"
          className="frost-mat cursor-pointer select-none rounded-[30px] p-2 [touch-action:manipulation] lg:h-full">
          <div className="relative overflow-hidden rounded-[22px] lg:h-full">
          <SmartImage src={r.coverUrl} alt={`${r.name} — signature dish`} width={1200} height={700} eager className="aspect-[4/3] w-full sm:aspect-[16/8] lg:aspect-auto lg:h-full" />
          <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-graphite/70 via-transparent to-transparent" />
          </div>
        </motion.div>
        <ul className="hidden h-full grid-rows-3 gap-3 lg:grid" aria-label="Gallery">
          {r.galleryUrls.slice(0, 3).map((g, i) => (
            <li key={g} className="frost-mat min-h-0 rounded-[20px]"><SmartImage src={g} alt={`${r.name} gallery photo ${i + 1}`} width={800} height={600} eager className="relative z-[2] size-full rounded-[14px]" /></li>
          ))}
        </ul>
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 28 }}
        className="liquid liquid-frost relative -mt-20 mx-3 rounded-tier p-5 sm:mx-6 sm:-mt-28 sm:p-7 lg:mr-[284px]">
        <div className="relative z-[2]">
          <div className="flex flex-wrap items-center gap-2 text-[14px] text-ink-2">
            <span>{cuisines}</span>
            {r.isPureVeg && <span className="inline-flex items-center gap-1.5 font-medium text-veg"><DietMark diet="veg" /> Pure veg</span>}
          </div>
          <h1 className="mt-1 text-[34px] leading-[1.02] sm:text-[52px]">{r.name}</h1>
          <p className="measure mt-3 text-[16px] text-ink-2">{r.description}</p>
          <MetaRow r={r} className="mt-5" />
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="accent" size="lg" onClick={onRate} icon={<Star className="size-4" />}>{hasReview ? 'Edit your review' : 'Rate this place'}</Button>
            <SaveButton restaurantId={r.id} name={r.name} withLabel className="h-13 px-5" />
          </div>
        </div>
      </motion.div>
    </header>
  )
}
