import { motion } from 'framer-motion'
import { LogOut, type LucideIcon } from 'lucide-react'
import { useRef } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { usePortalAuth } from '../../context/PortalAuthContext'
import { useIndicator } from '../../hooks/useIndicator'
import { cn } from '../../utils/cn'
import { AmbientField } from '../common/AmbientField'
import { Wordmark } from '../common/Wordmark'
import { LiveIndicator } from '../layout/LiveIndicator'
import { PageContainer } from '../layout/PageContainer'

export interface PortalNavItem { to: string; label: string; icon: LucideIcon; end?: boolean }

/** Frame for the restaurant partner portal and the admin console. Guards its own session. */
export function PortalShell({ badge, nav, home }: { badge: string; nav: PortalNavItem[]; home: string }) {
  const { role, user, status, logout } = usePortalAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const navRef = useRef<HTMLElement>(null)
  // re-measure once the session check finishes and the nav actually mounts (direct loads of a portal page)
  const pill = useIndicator(navRef, 'a[aria-current="page"]', `${pathname}|${status}|${user?.id ?? ''}`)

  if (status === 'loading') return <div className="grid min-h-dvh place-items-center"><span className="size-10 animate-spin rounded-full border-[3px] border-seam border-t-haldi" role="status" aria-label="Loading" /></div>
  if (!user) return <Navigate to={`/${role}/login`} replace />

  return (
    <div className="relative min-h-dvh pb-16">
      <AmbientField />
      <header className="sticky top-0 z-30 px-3 pt-3 sm:px-4">
        <div className="liquid-lens mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-3 gap-y-1 rounded-[28px] py-2 pl-3 pr-2 sm:pl-5">
          <Link to={home} className="relative z-[2] order-1 flex items-center gap-2.5 rounded-full">
            <Wordmark />
            <span className={cn('rounded-full px-2.5 py-1 text-[12px] font-bold uppercase tracking-wide', role === 'admin' ? 'bg-graphite text-on-ink' : 'haldi-gloss')}>{badge}</span>
          </Link>
          <div className="relative z-[2] order-2 ml-auto flex items-center gap-2 lg:order-3 lg:ml-0">
            <LiveIndicator to={role === 'admin' ? '/admin/live' : undefined} />
            <span className="hidden text-right text-[13px] leading-tight sm:block">
              <span className="block font-semibold">{user.fullName}</span>
              <span className="block text-ink-3">{user.email}</span>
            </span>
            <button type="button" onClick={() => { logout(); navigate(`/${role}/login`) }} aria-label="Log out"
              className="grid size-11 place-items-center rounded-full text-ink-2 hover:bg-brushed hover:text-ink"><LogOut className="size-5" /></button>
          </div>
          <nav ref={navRef} aria-label={`${badge} sections`} className="no-scrollbar relative z-[2] order-3 -mx-1 flex w-full gap-1 overflow-x-auto px-1 pb-1 lg:order-2 lg:mx-auto lg:w-auto lg:pb-0">
            {pill && <motion.span aria-hidden className="absolute left-0 top-0 rounded-full bg-ink shadow-e2" initial={false}
              animate={{ x: pill.x, y: pill.y, width: pill.w, height: pill.h }} transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            {nav.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) => cn('relative z-[1] flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[14px] font-medium transition-colors', isActive ? 'text-on-ink' : 'text-ink-2 hover:text-ink')}>
                <Icon className="size-4" aria-hidden />{label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <motion.main key={pathname} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
        <PageContainer className="pt-6 sm:pt-10"><Outlet /></PageContainer>
      </motion.main>
    </div>
  )
}
