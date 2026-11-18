import { useSyncExternalStore } from 'react'

export const BACKGROUNDS = [
  { id: 'white', name: 'Plain white', note: 'Neutral baseline, faint spice light' },
  { id: 'saffron', name: 'Haldi hour', note: 'Warm cream, turmeric light, chilli glow' },
  { id: 'leaf', name: 'Banana leaf', note: 'Fresh green, sky blue, leaf-vein texture' },
  { id: 'kokum', name: 'Kokum soda', note: 'Playful magenta, peach and lilac' },
  { id: 'rangoli', name: 'Rangoli', note: 'Five spices, a colour per tier, dot grid' },
  { id: 'coastal', name: 'Coastal morning', note: 'Cool sky, sea-green, one haldi sun' },
] as const
export type BackgroundId = (typeof BACKGROUNDS)[number]['id']

const KEY = 'oota:v1:bg'
const DEFAULT: BackgroundId = 'coastal'
const listeners = new Set<() => void>()
const valid = (v: string | null): v is BackgroundId => BACKGROUNDS.some((b) => b.id === v)

function read(): BackgroundId {
  const fromUrl = new URLSearchParams(window.location.search).get('bg')
  if (valid(fromUrl)) return fromUrl
  try {
    const v = window.localStorage.getItem(KEY)
    return valid(v) ? v : DEFAULT
  } catch {
    return DEFAULT
  }
}

let current: BackgroundId = typeof window === 'undefined' ? DEFAULT : read()
if (typeof document !== 'undefined') document.documentElement.dataset.bg = current

export function setBackground(id: BackgroundId) {
  current = id
  document.documentElement.dataset.bg = id
  try { window.localStorage.setItem(KEY, id) } catch { /* per-browser convenience only */ }
  listeners.forEach((l) => l())
}

export function useBackground(): BackgroundId {
  return useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb) }, () => current, () => DEFAULT)
}

/* ---- background colour strength (0–2×), a multiplier on the ambient spice light ---- */
const K_KEY = 'oota:v1:bg-strength'
const kListeners = new Set<() => void>()

function readStrength(): number {
  const fromUrl = Number(new URLSearchParams(window.location.search).get('bgk'))
  if (fromUrl >= 0 && fromUrl <= 2 && new URLSearchParams(window.location.search).has('bgk')) return fromUrl
  try {
    const v = Number(window.localStorage.getItem(K_KEY))
    return window.localStorage.getItem(K_KEY) !== null && v >= 0 && v <= 2 ? v : 1
  } catch {
    return 1
  }
}

let strength = typeof window === 'undefined' ? 1 : readStrength()
if (typeof document !== 'undefined') document.documentElement.style.setProperty('--amb-k', String(strength))

export function setBackgroundStrength(k: number) {
  strength = Math.min(2, Math.max(0, k))
  document.documentElement.style.setProperty('--amb-k', String(strength))
  try { window.localStorage.setItem(K_KEY, String(strength)) } catch { /* per-browser convenience only */ }
  kListeners.forEach((l) => l())
}

export function useBackgroundStrength(): number {
  return useSyncExternalStore((cb) => { kListeners.add(cb); return () => kListeners.delete(cb) }, () => strength, () => 1)
}
