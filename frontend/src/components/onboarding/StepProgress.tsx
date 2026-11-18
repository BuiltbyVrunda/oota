import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

/** Three tiffin tiers that fill with haldi as you go. */
export function StepProgress({ step, labels }: { step: number; labels: string[] }) {
  return (
    <ol className="flex w-full gap-2" aria-label={`Step ${step + 1} of ${labels.length}`}>
      {labels.map((l, i) => (
        <li key={l} className="flex flex-1 flex-col gap-2" aria-current={i === step ? 'step' : undefined}>
          <span className="relative h-2 overflow-hidden rounded-full bg-brushed shadow-engrave">
            <motion.span className="absolute inset-y-0 left-0 rounded-full bg-haldi shadow-[0_0_12px_var(--haldi)]"
              initial={false} animate={{ width: i < step ? '100%' : i === step ? '55%' : '0%' }} transition={{ type: 'spring', stiffness: 200, damping: 30 }} />
          </span>
          <span className={cn('text-[13px] font-medium', i <= step ? 'text-ink' : 'text-ink-3')}>{l}</span>
        </li>
      ))}
    </ol>
  )
}
