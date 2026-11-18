import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AmbientField } from '../common/AmbientField'
import { Footer } from './Footer'
import { MobileTabBar } from './MobileTabBar'
import { TopBar } from './TopBar'

export function AppShell() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0 }) }, [pathname])
  return (
    <div className="relative min-h-dvh">
      {!pathname.startsWith('/restaurant/') && <AmbientField />}
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-on-ink">Skip to content</a>
      <TopBar />
      {/* New page fades in immediately; nothing waits for the old page to animate out. */}
      <motion.main id="main" key={pathname} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: [0.2, 0.7, 0.2, 1] }}>
        <Outlet />
      </motion.main>
      <Footer />
      <MobileTabBar />
    </div>
  )
}
