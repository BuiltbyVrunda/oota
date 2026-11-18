import type { ReactNode } from 'react'

/** A small labelled number — data, not decoration. */
export function StatPlate({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="liquid-flat rounded-card px-4 py-3.5">
      <p className="relative z-[2] text-[13px] font-medium text-ink-3">{label}</p>
      <p className="tabular relative z-[2] mt-0.5 font-display text-[28px] font-semibold leading-tight">{value}</p>
      {sub && <p className="relative z-[2] text-[12px] text-ink-3">{sub}</p>}
    </div>
  )
}
