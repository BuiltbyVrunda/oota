import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { DEMO_PASSWORD } from '../data/users'
import { SEED } from '../data/seedWorld'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { User } from '../types'

interface StoredUser extends User { password: string }
type Result = { ok: true } | { ok: false; field?: 'email' | 'password' | 'fullName'; message: string }

interface AuthValue {
  user: User | null
  login: (email: string, password: string) => Promise<Result>
  signup: (fullName: string, email: string, password: string) => Promise<Result>
  logout: () => void
}

const Ctx = createContext<AuthValue | null>(null)
const seedUsers = (): StoredUser[] => SEED.users.map((u) => ({ ...u, password: DEMO_PASSWORD }))

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useLocalStorage<StoredUser[]>('oota:v1:users', seedUsers)
  const [sessionId, setSessionId] = useLocalStorage<number | null>('oota:v1:session', null)

  const user = useMemo(() => {
    const u = users.find((x) => x.id === sessionId)
    return u ? { id: u.id, fullName: u.fullName, email: u.email } : null
  }, [users, sessionId])

  const login = useCallback(async (email: string, password: string): Promise<Result> => {
    const u = users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
    if (!u) return { ok: false, field: 'email', message: 'No account with that email. Check the spelling or create one.' }
    if (u.password !== password) return { ok: false, field: 'password', message: 'That password doesn’t match. Demo accounts use demo1234.' }
    setSessionId(u.id)
    return { ok: true }
  }, [users, setSessionId])

  const signup = useCallback(async (fullName: string, email: string, password: string): Promise<Result> => {
    const e = email.trim().toLowerCase()
    if (users.some((x) => x.email.toLowerCase() === e)) return { ok: false, field: 'email', message: 'An account with this email already exists. Log in instead.' }
    const id = Math.max(...users.map((u) => u.id)) + 1
    setUsers((prev) => [...prev, { id, fullName: fullName.trim(), email: e, password }])
    setSessionId(id)
    return { ok: true }
  }, [users, setUsers, setSessionId])

  const logout = useCallback(() => setSessionId(null), [setSessionId])

  return <Ctx.Provider value={{ user, login, signup, logout }}>{children}</Ctx.Provider>
}

export function useAuth(): AuthValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth outside AuthProvider')
  return v
}
