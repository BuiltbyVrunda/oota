import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { cn } from '../../utils/cn'
import { useIndicator } from '../../hooks/useIndicator'
import { sectionId as slug } from '../../utils/menu'


/** Sticky category nav with scroll-spy and a gliding liquid indicator. Veg-only switch on the right. */
export function MenuNav({ categories, active, vegOnly, onVegOnly, showVegToggle }: {
  categories: string[]; active: string | null; vegOnly: boolean; onVegOnly: (v: boolean) => void; showVegToggle: boolean
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const pill = useIndicator(scroller, 'a[aria-current="true"]', `${active}|${categories.join('|')}`)
  useEffect(() => {
    // scroll only the pill row sideways — scrollIntoView would also nudge the page and fight the user's scroll
    const box = scroller.current
    const el = box?.querySelector<HTMLElement>(`[data-cat="${active}"]`)
    if (box && el) box.scrollTo({ left: el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' })
  }, [active])
  return (
    <nav aria-label="Menu categories" className="sticky top-[84px] z-20">
      <div className="liquid-lens flex items-center gap-2 rounded-full p-1.5">
        <div ref={scroller} className="no-scrollbar relative z-[2] flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {pill && <motion.span aria-hidden className="absolute left-0 top-0 rounded-full bg-ink" initial={false}
            animate={{ x: pill.x, y: pill.y, width: pill.w, height: pill.h }} transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
          {categories.map((c) => {
            const id = slug(c)
            const on = active === id
            return (
              <a key={c} href={`#${id}`} data-cat={id} aria-current={on ? 'true' : undefined}
                onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); history.replaceState(null, '', `#${id}`) }}
                className={cn('relative z-[1] flex h-10 shrink-0 items-center rounded-full px-4 text-[14px] font-medium transition-colors', on ? 'text-on-ink' : 'text-ink-2 hover:text-ink')}>
                {c}
              </a>
            )
          })}
        </div>
        {showVegToggle && (
          <label className="relative z-[2] flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full pl-3 pr-1.5 text-[14px] font-medium text-ink-2">
            <span className="hidden sm:inline">Veg only</span><span className="sm:hidden">Veg</span>
            <input type="checkbox" role="switch" checked={vegOnly} onChange={(e) => onVegOnly(e.target.checked)} className="peer sr-only" />
            <span aria-hidden className={cn('relative h-7 w-12 rounded-full border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-haldi peer-focus-visible:outline-offset-2',
              vegOnly ? 'border-veg bg-veg/30' : 'border-seam bg-brushed')}>
              <span className={cn('absolute top-0.5 size-5.5 rounded-full shadow-e1 transition-[left,background-color] duration-200', vegOnly ? 'left-[22px] bg-veg' : 'left-0.5 bg-ink-2')} />
            </span>
          </label>
        )}
      </div>
    </nav>
  )
}
