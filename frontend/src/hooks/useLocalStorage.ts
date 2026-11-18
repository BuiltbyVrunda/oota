import { useCallback, useEffect, useState } from 'react'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

/** localStorage-backed state. Re-reads when the key changes (keys are per-user). */
export function useLocalStorage<T>(key: string, initial: T | (() => T)) {
  const resolve = () => (typeof initial === 'function' ? (initial as () => T)() : initial)
  const [state, setState] = useState<{ key: string; value: T }>(() => ({ key, value: read(key, resolve()) }))

  // key switched (e.g. a different user logged in): load that key's value
  let value = state.value
  if (state.key !== key) {
    value = read(key, resolve())
    setState({ key, value })
  }

  useEffect(() => {
    try {
      window.localStorage.setItem(state.key, JSON.stringify(state.value))
    } catch {
      /* storage full or blocked: keep in memory */
    }
  }, [state])

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setState((s) => ({ key: s.key, value: typeof next === 'function' ? (next as (p: T) => T)(s.value) : next }))
  }, [])

  return [value, set] as const
}
