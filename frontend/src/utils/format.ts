const inrFmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export const inr = (n: number): string => inrFmt.format(n)
export const rating = (n: number): string => (n > 0 ? n.toFixed(1) : '—')
export const plural = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`

export function relativeTime(iso: string, now = Date.now()): string {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = s / 60
  if (m < 60) return `${Math.floor(m)} min ago`
  const h = m / 60
  if (h < 24) return `${Math.floor(h)} h ago`
  const d = h / 24
  if (d < 2) return 'yesterday'
  if (d < 30) return `${Math.floor(d)} days ago`
  const mo = d / 30
  if (mo < 12) return `${Math.floor(mo)} mo ago`
  return `${Math.floor(mo / 12)} yr ago`
}

const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

/** Handles places that close after midnight (closesAt < opensAt). */
export function openStatus(opensAt: string, closesAt: string, now = new Date()): { open: boolean; label: string } {
  const cur = now.getHours() * 60 + now.getMinutes()
  const o = toMin(opensAt)
  const c = toMin(closesAt)
  const open = c > o ? cur >= o && cur < c : cur >= o || cur < c
  return open ? { open, label: `Open · closes ${fmtTime(closesAt)}` } : { open, label: `Closed · opens ${fmtTime(opensAt)}` }
}

export function fmtTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  const hh = h % 12 === 0 ? 12 : h % 12
  return m ? `${hh}:${String(m).padStart(2, '0')} ${ampm}` : `${hh} ${ampm}`
}

export const firstName = (full: string): string => full.split(' ')[0] ?? full
