import { BarChart3, ClipboardList, Database, LayoutDashboard, MessageSquareText, ReceiptText, Store, Users, UtensilsCrossed } from 'lucide-react'
import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { PublicOnly, RequireAuth } from './components/layout/RouteGuards'
import { PortalShell, type PortalNavItem } from './components/portal/PortalShell'
import { PortalRoute } from './components/portal/PortalRoute'
import { AdminDishesPage } from './pages/admin/AdminDishesPage'
import { AdminNewRestaurantPage } from './pages/admin/AdminNewRestaurantPage'
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage'
import { AdminRestaurantsPage } from './pages/admin/AdminRestaurantsPage'
import { AdminReviewsPage } from './pages/admin/AdminReviewsPage'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'
import { DashboardPage } from './pages/DashboardPage'
import { DiscoverPage } from './pages/DiscoverPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { OrdersPage } from './pages/OrdersPage'
import { PartnerDishPage } from './pages/partner/PartnerDishPage'
import { PartnerMenuPage } from './pages/partner/PartnerMenuPage'
import { PartnerOrdersPage } from './pages/partner/PartnerOrdersPage'
import { PartnerOverviewPage } from './pages/partner/PartnerOverviewPage'
import { PartnerReviewsPage } from './pages/partner/PartnerReviewsPage'
import { PartnerSignupPage } from './pages/partner/PartnerSignupPage'
import { PortalLoginPage } from './pages/PortalLoginPage'
import { PreferencesPage } from './pages/PreferencesPage'
import { RestaurantPage } from './pages/RestaurantPage'
import { SavedPage } from './pages/SavedPage'
import { StatusPage } from './pages/StatusPage'

const PARTNER_NAV: PortalNavItem[] = [
  { to: '/partner', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/partner/menu', label: 'Menu', icon: UtensilsCrossed },
  { to: '/partner/reviews', label: 'Reviews', icon: MessageSquareText },
  { to: '/partner/orders', label: 'Orders', icon: ReceiptText },
]
const ADMIN_NAV: PortalNavItem[] = [
  { to: '/admin', label: 'Overview', icon: BarChart3, end: true },
  { to: '/admin/restaurants', label: 'Restaurants', icon: Store },
  { to: '/admin/dishes', label: 'Dishes', icon: ClipboardList },
  { to: '/admin/users', label: 'Diners', icon: Users },
  { to: '/admin/reviews', label: 'Reviews', icon: MessageSquareText },
  { to: '/admin/live', label: 'Live database', icon: Database },
]

export const router = createBrowserRouter([
  // ---- diners
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
        { path: '/orders', element: <OrdersPage /> },
        { path: '/preferences', element: <PreferencesPage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    }],
  },
  // ---- restaurant partners
  {
    element: <PortalRoute role="partner" />,
    children: [
      { path: '/partner/login', element: <PortalLoginPage /> },
      { path: '/partner/signup', element: <PartnerSignupPage /> },
      {
        path: '/partner',
        element: <PortalShell badge="Partner" nav={PARTNER_NAV} home="/partner" />,
        children: [
          { index: true, element: <PartnerOverviewPage /> },
          { path: 'menu', element: <PartnerMenuPage /> },
          { path: 'menu/:id', element: <PartnerDishPage /> },
          { path: 'reviews', element: <PartnerReviewsPage /> },
          { path: 'orders', element: <PartnerOrdersPage /> },
        ],
      },
    ],
  },
  // ---- admins
  {
    element: <PortalRoute role="admin" />,
    children: [
      { path: '/admin/login', element: <PortalLoginPage /> },
      {
        path: '/admin',
        element: <PortalShell badge="Admin" nav={ADMIN_NAV} home="/admin" />,
        children: [
          { index: true, element: <AdminOverviewPage /> },
          { path: 'restaurants', element: <AdminRestaurantsPage /> },
          { path: 'restaurants/new', element: <AdminNewRestaurantPage /> },
          { path: 'dishes', element: <AdminDishesPage /> },
          { path: 'users', element: <AdminUsersPage /> },
          { path: 'reviews', element: <AdminReviewsPage /> },
          { path: 'live', element: <StatusPage /> },
        ],
      },
    ],
  },
])
