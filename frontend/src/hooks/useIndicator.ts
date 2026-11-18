import { useLayoutEffect, useState, type RefObject } from 'react'

/**
 * Position of the "active" pill inside a nav, measured from the nav itself (offsetLeft/offsetWidth),
 * so page scroll or navigation can never make it fly in from elsewhere.
 */
/** `trigger` is any string that changes when the active item changes (e.g. the pathname). */
export function useIndicator(container: RefObject<HTMLElement | null>, activeSelector: string, trigger: string) {
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  useLayoutEffect(() => {
    const measure = () => {
      const el = container.current?.querySelector<HTMLElement>(activeSelector)
      setBox(el ? { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight } : null)
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (container.current) ro.observe(container.current)
    return () => ro.disconnect()
  }, [container, activeSelector, trigger])
  return box
}
