import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { ApiError, errorMessage } from '../api/client'
import { portalAuth, type PortalRole, type PortalUser } from '../api/portal'
import { useLive } from './LiveContext'

type Result = { ok: true } | { ok: false; field?: 'email' | 'password'; message: string }
interface PortalAuthValue {
  role: PortalRole
  user: PortalUser | null
  status: 'loading' | 'ready'
  login: (email: string, password: string) => Promise<Result>
  logout: () => void
  /** sign-up returns the new account: adopt it as the current session */
  adopt: (u: PortalUser) => void
}
const Ctx = createContext<PortalAuthValue | null>(null)

/** Session for one portal (restaurant partner or admin). Separate cookie and account table from diners. */
export function PortalAuthProvider({ role, children }: { role: PortalRole; children: ReactNode }) {
  const { version } = useLive()
  const [user, setUser] = useState<PortalUser | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')
  useEffect(() => {
    let alive = true
    portalAuth.me(role).then(
      (r) => { if (alive) { setUser(r.user); setStatus('ready') } },
      () => { if (alive) setStatus('ready') },
    )
    return () => { alive = false }
  }, [role, version])
  const login = useCallback(async (email: string, password: string): Promise<Result> => {
    try {
      setUser((await portalAuth.login(role, email, password)).user)
      return { ok: true }
    } catch (e) {
      if (e instanceof ApiError) return { ok: false, field: e.fields?.password ? 'password' : e.fields?.email ? 'email' : undefined, message: e.message }
      return { ok: false, message: errorMessage(e) }
    }
  }, [role])
  const logout = useCallback(() => { setUser(null); void portalAuth.logout(role).catch(() => {}) }, [role])
  const adopt = useCallback((u: PortalUser) => { setUser(u); setStatus('ready') }, [])
  return <Ctx.Provider value={{ role, user, status, login, logout, adopt }}>{children}</Ctx.Provider>
}

export function usePortalAuth(): PortalAuthValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('usePortalAuth outside PortalAuthProvider')
  return v
}
