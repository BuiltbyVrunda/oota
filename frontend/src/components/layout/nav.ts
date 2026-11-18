import { Bookmark, Compass, House, ReceiptText } from 'lucide-react'

export const NAV = [
  { to: '/', label: 'For you', icon: House },
  { to: '/discover', label: 'Discover', icon: Compass },
  { to: '/saved', label: 'Saved', icon: Bookmark },
  { to: '/orders', label: 'Orders', icon: ReceiptText },
] as const

export const isActive = (pathname: string, to: string): boolean => (to === '/' ? pathname === '/' : pathname.startsWith(to))
