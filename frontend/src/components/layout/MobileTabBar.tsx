import { motion } from 'framer-motion'
import { SlidersHorizontal } from 'lucide-react'
import { useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useIndicator } from '../../hooks/useIndicator'
import { cn } from '../../utils/cn'
import { NAV, isActive } from './nav'

const TABS = [...NAV, { to: '/preferences', label: 'Taste', icon: SlidersHorizontal }] as const

export function MobileTabBar() {
  const { pathname } = useLocation()
  const barRef = useRef<HTMLDivElement>(null)
  const pill = useIndicator(barRef, 'a[aria-current="page"]', pathname)
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(12px,env(safe-area-inset-bottom))] md:hidden">
      <div ref={barRef} className="liquid-lens mx-auto flex h-[68px] max-w-[440px] items-center justify-around rounded-full px-1.5">
        {pill && <motion.span aria-hidden className="absolute left-0 top-0 z-[1] rounded-full bg-ink" initial={false}
          animate={{ x: pill.x + 4, y: pill.y, width: pill.w - 8, height: pill.h }} transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
        {TABS.map(({ to, label, icon: Icon }) => {
          const active = isActive(pathname, to)
          return (
            <NavLink key={to} to={to} end={to === '/'} className={cn('relative z-[2] flex h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[12px] font-medium',
              active ? 'text-on-ink' : 'text-ink-2')}>
              <Icon className="size-5" aria-hidden />
              {label}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
