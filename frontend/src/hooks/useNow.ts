import { useEffect, useState } from 'react'

/** A clock that ticks once a minute — keeps "x min ago", Open/Closed and search decay fresh without impure renders. */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(t)
  }, [intervalMs])
  return now
}
