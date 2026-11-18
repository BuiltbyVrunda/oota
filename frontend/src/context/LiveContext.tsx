import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

export interface ChangeEvent { source: 'postgres' | 'mongo'; table: string; op: string; at: string }
interface LiveValue {
  /** bumps whenever either database changes (debounced) — data hooks refetch on it */
  version: number
  connected: boolean
  last: ChangeEvent | null
  bump: () => void
}
const Ctx = createContext<LiveValue | null>(null)

/**
 * Subscribes to /api/events (Server-Sent Events). The backend relays PostgreSQL NOTIFY (row triggers + a DDL
 * event trigger) and MongoDB change streams, so a change typed in a terminal re-renders the UI within ~1s.
 * Also refetches when the tab regains focus, as a fallback.
 */
export function LiveProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0)
  const [connected, setConnected] = useState(false)
  const [last, setLast] = useState<ChangeEvent | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const bump = useCallback(() => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setVersion((v) => v + 1), 180)
  }, [])

  useEffect(() => {
    let es: EventSource | null = null
    let retry: number | undefined
    const open = () => {
      es = new EventSource('/api/events')
      es.addEventListener('hello', () => setConnected(true))
      es.addEventListener('change', (m) => {
        try { setLast(JSON.parse((m as MessageEvent<string>).data) as ChangeEvent) } catch { /* ignore */ }
        bump()
      })
      es.onerror = () => {
        setConnected(false)
        es?.close()
        retry = window.setTimeout(open, 2500)
      }
    }
    open()
    const onFocus = () => { if (document.visibilityState === 'visible') bump() }
    document.addEventListener('visibilitychange', onFocus)
    window.addEventListener('focus', onFocus)
    return () => {
      es?.close()
      window.clearTimeout(retry)
      document.removeEventListener('visibilitychange', onFocus)
      window.removeEventListener('focus', onFocus)
    }
  }, [bump])

  return <Ctx.Provider value={{ version, connected, last, bump }}>{children}</Ctx.Provider>
}

export function useLive(): LiveValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useLive outside LiveProvider')
  return v
}
