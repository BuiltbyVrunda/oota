import { Check } from 'lucide-react'
import { useId } from 'react'
import { BACKGROUNDS, CARD_COLOURS, setBackground, setBackgroundStrength, setCardColour, useBackground, useBackgroundStrength, useCardColour } from '../../hooks/useBackground'
import { cn } from '../../utils/cn'

/** Live preview swatches: each one renders its own theme's ground + spice light in miniature. */
export function BackgroundPicker() {
  const active = useBackground()
  return (
    <div role="radiogroup" aria-label="Background" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {BACKGROUNDS.map((b) => {
        const on = active === b.id
        return (
          <button key={b.id} type="button" role="radio" aria-checked={on} onClick={() => setBackground(b.id)}
            className={cn('group relative overflow-hidden rounded-card text-left transition-[transform,box-shadow] active:scale-[0.98]',
              on ? 'shadow-[0_0_0_2px_var(--graphite),0_0_0_5px_var(--haldi)]' : 'shadow-e2 hover:-translate-y-0.5')}>
            <div data-bg={b.id} className="relative h-28 overflow-hidden bg-ground">
              {(['a', 'b', 'c', 'd', 'e'] as const).map((v, i) => (
                <span key={v} aria-hidden className="absolute size-28 rounded-full blur-2xl"
                  style={{ background: `var(--amb-${v})`, opacity: `min(1, calc(var(--amb-${v}-o) * var(--amb-k, 0)))`, left: `${[-10, 55, 30, -5, 70][i]}%`, top: `${[-30, -10, 45, 40, 50][i]}%` }} />
              ))}
              <span aria-hidden className="absolute inset-0" style={{ background: 'var(--amb-pattern)' }} />
              <span aria-hidden className="liquid-flat tint-haldi absolute bottom-3 left-3 right-10 h-9 rounded-[10px]" />
              <span aria-hidden className="liquid-flat tint-kokum absolute bottom-3 right-3 size-9 rounded-full" />
              {on && <span className="haldi-gloss absolute right-2 top-2 grid size-6 place-items-center rounded-full"><Check className="size-3.5" strokeWidth={3} aria-hidden /></span>}
            </div>
            <div className="bg-plate-strong px-3 py-2.5">
              <p className="text-[14px] font-semibold">{b.name}</p>
              <p className="text-[12px] text-ink-3">{b.note}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

const strengthWord = (k: number) => (k === 0 ? 'Off' : k < 0.6 ? 'Soft' : k < 1.15 ? 'Balanced' : k < 1.6 ? 'Vivid' : 'Max')

/** Continuous slider for how strongly the background colour shows (0–200%). Applies live. */
export function BackgroundStrength() {
  const k = useBackgroundStrength()
  const id = useId()
  const pct = Math.round(k * 100)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-[15px] font-semibold">Background colour strength</label>
        <span className="tabular text-[14px] font-semibold text-haldi-ink" aria-hidden>{strengthWord(k)} · {pct}%</span>
      </div>
      <div className="relative flex h-11 items-center">
        <div aria-hidden className="absolute inset-x-0 h-2.5 rounded-full shadow-engrave"
          style={{ background: 'linear-gradient(90deg, var(--ground), color-mix(in srgb, var(--amb-a) 45%, var(--ground)), var(--amb-a), var(--amb-b))' }} />
        <input id={id} type="range" min={0} max={200} step={5} value={pct} onChange={(e) => setBackgroundStrength(Number(e.target.value) / 100)}
          aria-valuetext={`${strengthWord(k)}, ${pct} percent`}
          className="relative w-full cursor-pointer appearance-none bg-transparent
            [&::-webkit-slider-thumb]:size-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ink [&::-webkit-slider-thumb]:shadow-e2 [&::-webkit-slider-thumb]:ring-4 [&::-webkit-slider-thumb]:ring-white
            [&::-moz-range-thumb]:size-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-ink" />
      </div>
      <div className="flex items-center justify-between text-[13px] text-ink-3">
        <span>Plain</span>
        <button type="button" onClick={() => setBackgroundStrength(1)} disabled={pct === 100}
          className="h-8 rounded-full px-3 font-semibold text-haldi-ink hover:bg-haldi-wash disabled:opacity-40 disabled:hover:bg-transparent">Reset to 100%</button>
        <span>2× vivid</span>
      </div>
    </div>
  )
}

/** Card colour: re-tints every glass card. Each swatch is a mini glass card rendered with that option. */
export function CardColourPicker() {
  const active = useCardColour()
  return (
    <div>
      <p className="text-[15px] font-semibold">Card colour</p>
      <div role="radiogroup" aria-label="Card colour" className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {CARD_COLOURS.map((c) => {
          const on = active === c.id
          return (
            <button key={c.id} type="button" role="radio" aria-checked={on} onClick={() => setCardColour(c.id)} data-card={c.id}
              className={cn('flex flex-col gap-2 rounded-card p-2 text-left transition-transform active:scale-[0.97]',
                on ? 'shadow-[0_0_0_2px_var(--graphite),0_0_0_5px_var(--haldi)]' : 'hover:-translate-y-0.5')}>
              <span aria-hidden className="relative flex h-16 gap-1 overflow-hidden rounded-[12px]">
                {c.id === 'spice'
                  ? (['tint-haldi', 'tint-chilli', 'tint-kokum', 'tint-leaf'] as const).map((t) => <span key={t} className={cn('liquid-flat flex-1 rounded-[8px]', t)} />)
                  : <span className="liquid-flat tint-haldi flex-1 rounded-[10px]" />}
              </span>
              <span className="px-1">
                <span className="block text-[14px] font-semibold">{c.name}</span>
                <span className="block text-[12px] text-ink-3">{c.note}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
