import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { PublicOnly, RequireAuth } from './components/layout/RouteGuards'
import { AddDishPage } from './pages/AddDishPage'
import { DashboardPage } from './pages/DashboardPage'
import { DiscoverPage } from './pages/DiscoverPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { PreferencesPage } from './pages/PreferencesPage'
import { RestaurantPage } from './pages/RestaurantPage'
import { SavedPage } from './pages/SavedPage'
import { StatusPage } from './pages/StatusPage'

export const router = createBrowserRouter([
  { element: <PublicOnly />, children: [{ path: '/login' }, { path: '/signup' }] },
  { element: <RequireAuth allowUnonboarded />, children: [{ path: '/onboarding', element: <OnboardingPage /> }] },
  {
    element: <RequireAuth />,
    children: [{
      element: <AppShell />,
      children: [
        { path: '/', element: <DashboardPage /> },
        { path: '/discover', element: <DiscoverPage /> },
        { path: '/restaurant/:slug', element: <RestaurantPage /> },
        { path: '/saved', element: <SavedPage /> },
        { path: '/preferences', element: <PreferencesPage /> },
        { path: '/add-dish', element: <AddDishPage /> },
        { path: '/status', element: <StatusPage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    }],
  },
])
