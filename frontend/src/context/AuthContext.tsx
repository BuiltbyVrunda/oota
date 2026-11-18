import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { ApiError, errorMessage } from '../api/client'
import { endpoints } from '../api/endpoints'
import type { User } from '../types'
import { useLive } from './LiveContext'

type Field = 'email' | 'password' | 'fullName'
type Result = { ok: true } | { ok: false; field?: Field; message: string }

interface AuthValue {
  user: User | null
  status: 'loading' | 'ready'
  login: (email: string, password: string) => Promise<Result>
  signup: (fullName: string, email: string, password: string) => Promise<Result>
  logout: () => void
}
const Ctx = createContext<AuthValue | null>(null)

function toResult(e: unknown): Result {
  if (e instanceof ApiError) {
    const field = (Object.keys(e.fields ?? {}).find((k) => ['email', 'password', 'fullName'].includes(k)) as Field | undefined)
    return { ok: false, field, message: e.message }
  }
  return { ok: false, message: errorMessage(e) }
}

/** Session = httpOnly JWT cookie set by the API. /auth/me tells us who is logged in (re-checked on DB changes). */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { version } = useLive()
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  useEffect(() => {
    let alive = true
    endpoints.me().then(
      (r) => { if (alive) { setUser(r.user); setStatus('ready') } },
      (e) => {
        if (!alive) return
        // 401 = logged out (or the user row was deleted in the terminal). Other errors: keep current state.
        if (e instanceof ApiError && e.status === 401) setUser(null)
        setStatus('ready')
      },
    )
    return () => { alive = false }
  }, [version])

  const login = useCallback(async (email: string, password: string): Promise<Result> => {
    try { setUser((await endpoints.login(email, password)).user); return { ok: true } } catch (e) { return toResult(e) }
  }, [])
  const signup = useCallback(async (fullName: string, email: string, password: string): Promise<Result> => {
    try { setUser((await endpoints.signup(fullName, email, password)).user); return { ok: true } } catch (e) { return toResult(e) }
  }, [])
  const logout = useCallback(() => {
    setUser(null)
    void endpoints.logout().catch(() => {})
  }, [])

  return <Ctx.Provider value={{ user, status, login, signup, logout }}>{children}</Ctx.Provider>
}

export function useAuth(): AuthValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth outside AuthProvider')
  return v
}
