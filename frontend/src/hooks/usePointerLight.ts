import { useCallback, type PointerEvent } from 'react'

/** Feeds --mx / --my to a `.lit` liquid-glass surface so its specular highlight follows the pointer. */
export function usePointerLight() {
  return useCallback((e: PointerEvent<HTMLElement>) => {
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  }, [])
}
