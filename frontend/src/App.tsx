import { AnimatePresence, MotionConfig } from 'framer-motion'
import { useCallback, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { Splash } from './components/splash/Splash'
import { Toaster } from './components/ui/Toast'
import { ActivityProvider } from './context/ActivityContext'
import { AuthProvider } from './context/AuthContext'
import { CatalogProvider } from './context/CatalogContext'
import { FavouritesProvider } from './context/FavouritesContext'
import { PreferencesProvider } from './context/PreferencesContext'
import { ReviewsProvider } from './context/ReviewsContext'
import { LikeBurstProvider } from './context/LikeBurstContext'
import { LiveProvider } from './context/LiveContext'
import { ToastProvider } from './context/ToastContext'
import { router } from './router'

const SPLASH_KEY = 'oota:v1:splash-seen'

function firstVisitThisSession(): boolean {
  try {
    return window.sessionStorage.getItem(SPLASH_KEY) === null
  } catch {
    return false
  }
}

export default function App() {
  const [splash, setSplash] = useState(firstVisitThisSession)
  const endSplash = useCallback(() => {
    try { window.sessionStorage.setItem(SPLASH_KEY, '1') } catch { /* private mode */ }
    setSplash(false)
  }, [])
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <LiveProvider>
        <AuthProvider>
          <PreferencesProvider>
            <ActivityProvider>
              <LikeBurstProvider>
              <FavouritesProvider>
                <ReviewsProvider>
                  <CatalogProvider>
                    <RouterProvider router={router} />
                    <Toaster />
                  </CatalogProvider>
                </ReviewsProvider>
              </FavouritesProvider>
              </LikeBurstProvider>
            </ActivityProvider>
          </PreferencesProvider>
        </AuthProvider>
        </LiveProvider>
      </ToastProvider>
      <AnimatePresence>{splash && <Splash onDone={endSplash} />}</AnimatePresence>
    </MotionConfig>
  )
}
