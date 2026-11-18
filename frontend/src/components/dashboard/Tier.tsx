import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import type { Signal } from '../../types'
import { cn } from '../../utils/cn'
import { ReasonPlate } from '../common/ReasonPlate'

/** One tier of the tiffin: a liquid band with a title and its engraved reason plate. Tiers stack in on load. */
export type TierTint = 'haldi' | 'chilli' | 'leaf' | 'kokum' | 'coconut'
const TINT: Record<TierTint, string> = { haldi: 'tint-haldi', chilli: 'tint-chilli', leaf: 'tint-leaf', kokum: 'tint-kokum', coconut: 'tint-coconut' }

export function Tier({ id, title, reason, signals, children, index, className, tint = 'haldi' }: {
  id: string; title: ReactNode; reason: string; signals: Signal[]; children: ReactNode; index: number; className?: string; tint?: TierTint
}) {
  return (
    <motion.section aria-labelledby={`${id}-title`}
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 + index * 0.06, duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
      className={cn('liquid rounded-tier px-4 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6', TINT[tint], className)}>
      <div className="relative z-[2]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pr-0 md:pr-24">
          <h2 id={`${id}-title`} className="min-w-0 text-[22px] sm:text-[26px]">{title}</h2>
          <ReasonPlate reason={reason} signals={signals} title={typeof title === 'string' ? title : 'this tier'} />
        </div>
        {children}
      </div>
    </motion.section>
  )
}
