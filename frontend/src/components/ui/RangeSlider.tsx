import { useId } from 'react'
import { cn } from '../../utils/cn'

interface Props { label: string; min: number; max: number; value: number; onChange: (v: number) => void; marks: string[]; className?: string }

/** Stepped slider (e.g. spice 0–3) with labelled stops. Native range input underneath for keyboard + a11y. */
export function RangeSlider({ label, min, max, value, onChange, marks, className }: Props) {
  const id = useId()
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-[14px] font-medium text-ink-2">{label}</label>
        <span className="text-[14px] font-semibold text-haldi-ink">{marks[value - min]}</span>
      </div>
      <div className="relative h-11">
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-brushed shadow-engrave" />
        <div className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-leaf via-haldi to-chilli" style={{ width: `${pct}%` }} />
        {marks.map((_, i) => (
          <span key={i} aria-hidden className={cn('absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full', i + min <= value ? 'bg-ink' : 'bg-seam-strong')}
            style={{ left: `${(i / (max - min)) * 100}%` }} />
        ))}
        <input id={id} type="range" min={min} max={max} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))}
          aria-valuetext={marks[value - min]}
          className="absolute inset-0 w-full cursor-pointer appearance-none bg-transparent
            [&::-webkit-slider-thumb]:size-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ink [&::-webkit-slider-thumb]:shadow-e2 [&::-webkit-slider-thumb]:ring-4 [&::-webkit-slider-thumb]:ring-haldi/40
            [&::-moz-range-thumb]:size-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-ink" />
      </div>
      <div className="flex justify-between text-[12px] text-ink-3">{marks.map((m) => <span key={m}>{m}</span>)}</div>
    </div>
  )
}
