import type { Diet } from '../../types'
import { cn } from '../../utils/cn'

const label: Record<Diet, string> = { veg: 'Vegetarian', vegan: 'Vegan', egg: 'Contains egg', nonveg: 'Non-vegetarian' }

/** Indian food-mark: square outline + inner shape. Never colour alone — shape differs per diet, and vegan gets a leaf notch. */
export function DietMark({ diet, showLabel, className }: { diet: Diet; showLabel?: boolean; className?: string }) {
  const color = diet === 'nonveg' ? 'var(--nonveg)' : diet === 'egg' ? 'var(--egg)' : 'var(--veg)'
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <svg viewBox="0 0 16 16" className="size-4 shrink-0" role="img" aria-label={label[diet]}>
        <rect x="1" y="1" width="14" height="14" rx="3" fill="rgb(255 255 255 / 0.92)" stroke={color} strokeWidth="1.6" />
        {diet === 'veg' && <circle cx="8" cy="8" r="3.4" fill={color} />}
        {diet === 'vegan' && <path d="M8 3.6c3 1 3.8 3.9 3 6.6-2.6.6-5.6-.4-6.2-3.2C4.5 5.6 6 4 8 3.6Z M5.4 11.2 9.6 6.2" fill={color} stroke={color} strokeWidth="0.8" />}
        {diet === 'nonveg' && <path d="M8 3.8 12 11.6H4L8 3.8Z" fill={color} />}
        {diet === 'egg' && <path d="M4.6 8a3.4 3.4 0 0 1 6.8 0Z" fill={color} />}
      </svg>
      {showLabel && <span className="text-[13px] font-medium text-ink-2">{label[diet]}</span>}
    </span>
  )
}
