import { motion } from 'framer-motion'
import { LogOut, Search, SlidersHorizontal } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../utils/cn'
import { firstName } from '../../utils/format'
import { useIndicator } from '../../hooks/useIndicator'
import { Wordmark } from '../common/Wordmark'
import { Popover } from '../ui/Popover'
import { NAV, isActive } from './nav'


export function TopBar() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const navRef = useRef<HTMLElement>(null)
  const pill = useIndicator(navRef, 'a[aria-current="page"]', pathname)

  // "/" jumps to search from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.key !== '/' || t.closest('input,textarea,select,[contenteditable]')) return
      e.preventDefault()
      navigate('/discover?focus=1')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  return (
    <header className="sticky top-0 z-30 px-3 pt-3 sm:px-4">
      <div className="liquid-lens mx-auto flex h-16 max-w-[1240px] items-center gap-3 rounded-full pl-3 pr-2 sm:pl-5">
        <Link to="/" className="relative z-[2] rounded-full" aria-label="Oota home"><Wordmark /></Link>

        <nav ref={navRef} aria-label="Main" className="relative z-[2] mx-auto hidden items-center gap-1 md:flex">
          {pill && <motion.span aria-hidden className="absolute left-0 top-0 rounded-full bg-ink shadow-e2" initial={false}
            animate={{ x: pill.x, y: pill.y, width: pill.w, height: pill.h }} transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = isActive(pathname, to)
            return (
              <NavLink key={to} to={to} end={to === '/'}
                className={cn('relative z-[1] flex h-11 items-center gap-2 rounded-full px-4 text-[15px] font-medium transition-colors', active ? 'text-on-ink' : 'text-ink-2 hover:text-ink')}>
                <Icon className="size-4" aria-hidden />
                {label}
              </NavLink>
            )
          })}
        </nav>

        <div className="relative z-[2] ml-auto flex items-center gap-2 md:ml-0">
          <Link to="/discover?focus=1" className="hidden h-11 items-center gap-2 rounded-full border border-seam bg-brushed pl-3.5 pr-2 text-[14px] text-ink-3 hover:border-seam-strong hover:text-ink-2 lg:flex">
            <Search className="size-4" aria-hidden />
            <span className="w-40">Search dosa, ramen…</span>
            <kbd className="grid size-6 place-items-center rounded-md border border-seam text-[12px] font-sans">/</kbd>
          </Link>
          <Link to="/discover?focus=1" aria-label="Search" className="grid size-11 place-items-center rounded-full text-ink hover:bg-brushed lg:hidden">
            <Search className="size-5" />
          </Link>
          {user && (
            <Popover label="Account" align="end" trigger={({ open, toggle, id }) => (
              <button type="button" onClick={toggle} aria-expanded={open} aria-controls={id} aria-label={`Account menu for ${user.fullName}`}
                className="haldi-gloss grid size-11 place-items-center rounded-full text-[16px] font-bold">
                {firstName(user.fullName).charAt(0)}
              </button>
            )}>
              {(close) => (
                <div className="flex flex-col">
                  <p className="text-[16px] font-semibold">{user.fullName}</p>
                  <p className="text-[14px] text-ink-3">{user.email}</p>
                  <div className="my-3 h-px bg-seam" />
                  <Link to="/preferences" onClick={close} className="flex h-11 items-center gap-3 rounded-md px-2 text-[15px] hover:bg-brushed">
                    <SlidersHorizontal className="size-4 text-pewter" aria-hidden /> Taste preferences
                  </Link>
                  <button type="button" onClick={() => { close(); logout(); navigate('/login') }}
                    className="flex h-11 items-center gap-3 rounded-md px-2 text-left text-[15px] hover:bg-brushed">
                    <LogOut className="size-4 text-pewter" aria-hidden /> Log out
                  </button>
                </div>
              )}
            </Popover>
          )}
        </div>
      </div>
    </header>
  )
}
