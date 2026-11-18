import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLive } from '../context/LiveContext'
import { errorMessage } from '../api/client'

export type Status = 'loading' | 'ready' | 'error'

/**
 * Fetches `fetcher()` whenever `key` changes or the live database version bumps.
 * Keeps showing the previous data while refetching (no flashes); on failure clears it and exposes the error.
 * Pass key = null to skip (e.g. logged out).
 */
export function useResource<T>(key: string | null, fetcher: () => Promise<T>) {
  const { version } = useLive()
  const [state, setState] = useState<{ key: string | null; data: T | null; status: Status; error: string | null }>({ key, data: null, status: key ? 'loading' : 'ready', error: null })
  const fetchRef = useRef(fetcher)
  useLayoutEffect(() => { fetchRef.current = fetcher })
  const [nonce, setNonce] = useState(0)

  if (state.key !== key) setState({ key, data: null, status: key ? 'loading' : 'ready', error: null })

  useEffect(() => {
    if (key === null) return
    let alive = true
    fetchRef.current().then(
      (data) => { if (alive) setState({ key, data, status: 'ready', error: null }) },
      // on failure drop the old data: if a table was dropped in the terminal, the UI must say so, not show stale rows
      (e) => { if (alive) setState({ key, data: null, status: 'error', error: errorMessage(e) }) },
    )
    return () => { alive = false }
  }, [key, version, nonce])

  const refresh = useCallback(() => setNonce((n) => n + 1), [])
  const mutate = useCallback((fn: (d: T | null) => T | null) => setState((s) => ({ ...s, data: fn(s.data) })), [])
  return { data: state.data, status: state.status, error: state.error, refresh, mutate }
}
