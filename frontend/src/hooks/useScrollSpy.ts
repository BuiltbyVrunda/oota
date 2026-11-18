import { useEffect, useState } from 'react'

/** Returns the id of the section currently under the sticky nav. */
export function useScrollSpy(ids: string[], offset = 140): string | null {
  const [active, setActive] = useState<string | null>(ids[0] ?? null)
  useEffect(() => {
    if (!ids.length) return
    const onScroll = () => {
      let current = ids[0]
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top - offset <= 0) current = id
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = ids[ids.length - 1]
      setActive(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [ids, offset])
  return active
}
