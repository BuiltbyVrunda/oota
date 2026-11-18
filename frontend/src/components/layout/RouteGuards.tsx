import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { usePreferences } from '../../context/PreferencesContext'
import { Wordmark } from '../common/Wordmark'
import { AuthLayout } from './AuthLayout'
import { AuthPage } from '../../pages/AuthPage'

/** Logged-in guard. Users who haven't onboarded are sent to /onboarding first. */
export function RequireAuth({ allowUnonboarded = false }: { allowUnonboarded?: boolean }) {
  const { user, status } = useAuth()
  const { prefs, status: prefsStatus } = usePreferences()
  const loc = useLocation()
  if (status === 'loading' || (user && prefsStatus === 'loading')) return <BootLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />
  if (!allowUnonboarded && !prefs.onboarded) return <Navigate to="/onboarding" replace />
  return <Outlet />
}

/** /login and /signup render the same mounted AuthPage, so the card morphs between modes instead of remounting. */
export function PublicOnly() {
  const { user, status } = useAuth()
  if (status === 'loading') return <BootLoader />
  if (user) return <Navigate to="/" replace />
  return (
    <AuthLayout>
      <div className="liquid liquid-strong w-full max-w-[460px] rounded-tier p-6 sm:p-8">
        <div className="relative z-[2]">
          <Wordmark className="mb-8 lg:hidden" />
          <AuthPage />
        </div>
      </div>
    </AuthLayout>
  )
}

/** Shown for the split second while the session cookie is checked. */
function BootLoader() {
  return (
    <div className="grid min-h-dvh place-items-center" role="status" aria-label="Loading">
      <span className="size-10 animate-spin rounded-full border-[3px] border-seam border-t-haldi" />
    </div>
  )
}
