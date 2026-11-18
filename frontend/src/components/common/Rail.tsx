import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../utils/cn'
import { IconButton } from '../ui/IconButton'

/** Horizontal scroll-snap rail. Items stay in the tab order; arrow buttons page by one viewport. */
export function Rail({ children, label, className, itemClassName }: { children: ReactNode[]; label: string; className?: string; itemClassName?: string }) {
  const ref = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })
  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 })
  }, [])
  useEffect(() => {
    update()
    const el = ref.current
    el?.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => { el?.removeEventListener('scroll', update); window.removeEventListener('resize', update) }
  }, [update, children.length])
  const page = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: 'smooth' })
  return (
    <div className={cn('relative', className)}>
      <ul ref={ref} aria-label={label}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 pt-1 sm:-mx-6 sm:scroll-px-6 sm:px-6"
        style={{ maskImage: `linear-gradient(90deg, ${edges.start ? '#000' : 'transparent'} 0, #000 28px, #000 calc(100% - 28px), ${edges.end ? '#000' : 'transparent'} 100%)` }}>
        {children.map((c, i) => <li key={i} className={cn('shrink-0 snap-start', itemClassName)}>{c}</li>)}
      </ul>
      <div className="pointer-events-none absolute -top-14 right-0 hidden gap-2 md:flex">
        <IconButton label={`Scroll ${label} back`} onClick={() => page(-1)} disabled={edges.start} size="sm" className="pointer-events-auto"><ChevronLeft className="size-4" /></IconButton>
        <IconButton label={`Scroll ${label} forward`} onClick={() => page(1)} disabled={edges.end} size="sm" className="pointer-events-auto"><ChevronRight className="size-4" /></IconButton>
      </div>
    </div>
  )
}
