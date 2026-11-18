import { useNavigate } from 'react-router-dom'
import { Tabs } from '../ui/Tabs'

export function AuthSwitcher({ mode }: { mode: 'login' | 'signup' }) {
  const navigate = useNavigate()
  return (
    <Tabs label="Log in or sign up" value={mode} onChange={(k) => navigate(k === 'login' ? '/login' : '/signup')}
      items={[{ key: 'login', label: 'Log in' }, { key: 'signup', label: 'Sign up' }]} className="w-full [&>button]:flex-1 [&>button]:justify-center" />
  )
}
