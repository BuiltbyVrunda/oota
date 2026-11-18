import { motion, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useRef, type ReactNode } from 'react'

const drop = (delay: number) => ({
  initial: { y: -90, opacity: 0, scaleY: 1.06 },
  animate: { y: 0, opacity: 1, scaleY: 1 },
  transition: { delay, type: 'spring' as const, stiffness: 520, damping: 22, mass: 0.9 },
})

/** One enamel-painted tier: coloured body, steel rim on top, a painted dot band, soft shadow. */
function Tier({ delay, enamel, children, h = 58 }: { delay: number; enamel: string; children?: ReactNode; h?: number }) {
  return (
    <motion.div {...drop(delay)} className="relative w-[188px] rounded-[16px] shadow-[0_12px_20px_-12px_rgb(29_28_26/0.45)]" style={{ height: h, background: `var(${enamel})` }}>
      <div className="absolute inset-x-0 top-0 h-[7px] rounded-t-[16px]" style={{ background: 'var(--steel-band)' }} />
      <div aria-hidden className="absolute inset-x-5 bottom-[9px] h-[5px] opacity-80"
        style={{ backgroundImage: 'radial-gradient(circle, rgb(255 255 255 / 0.95) 1.6px, transparent 2px)', backgroundSize: '12px 5px' }} />
      <div className="absolute inset-x-0 bottom-0 h-[3px] rounded-b-[16px] bg-black/15" />
      {children}
    </motion.div>
  )
}

/**
 * Once-per-session splash on white. A colourful enamel tiffin assembles tier by tier (leaf, haldi, chilli,
 * kokum lid), the steel clamp locks with a glint, ಊಟ is engraved on the haldi tier, steam rises.
 * Click, Skip or any key ends it.
 */
export function Splash({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion()
  const done = useRef(false)
  const finish = useCallback(() => {
    if (done.current) return
    done.current = true
    onDone()
  }, [onDone])

  useEffect(() => {
    const t = window.setTimeout(finish, reduce ? 900 : 2300)
    const key = () => finish()
    window.addEventListener('keydown', key)
    return () => { window.clearTimeout(t); window.removeEventListener('keydown', key) }
  }, [reduce, finish])

  const d = reduce ? () => 0 : (n: number) => n

  return (
    <motion.div
      role="dialog" aria-label="Oota is opening" aria-live="polite"
      onClick={finish}
      className="fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center overflow-hidden"
      style={{ background: 'var(--splash-bg)' }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* soft spice light on white */}
      <motion.div aria-hidden className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9 }}>
        <div className="absolute left-1/2 top-1/2 size-[80vmin] -translate-x-[78%] -translate-y-[70%] rounded-full opacity-30 blur-[90px]" style={{ background: 'radial-gradient(circle, var(--haldi), transparent 62%)' }} />
        <div className="absolute left-1/2 top-1/2 size-[70vmin] -translate-x-[10%] -translate-y-[40%] rounded-full opacity-20 blur-[100px]" style={{ background: 'radial-gradient(circle, var(--chilli), transparent 62%)' }} />
        <div className="absolute left-1/2 top-1/2 size-[70vmin] -translate-x-[60%] translate-y-[5%] rounded-full opacity-20 blur-[100px]" style={{ background: 'radial-gradient(circle, var(--kokum), transparent 62%)' }} />
        <div className="absolute left-1/2 top-1/2 size-[55vmin] translate-x-[5%] -translate-y-[95%] rounded-full opacity-20 blur-[90px]" style={{ background: 'radial-gradient(circle, var(--leaf), transparent 62%)' }} />
      </motion.div>

      <div className="relative flex flex-col items-center">
        {/* steam */}
        <svg aria-hidden width="120" height="70" viewBox="0 0 120 70" className="-mb-2 overflow-visible">
          {[30, 60, 90].map((x, i) => (
            <motion.path key={x} d={`M${x} 68 C ${x - 12} 52, ${x + 12} 40, ${x} 24 S ${x - 8} 6, ${x + 2} 0`}
              fill="none" stroke="rgb(29 28 26 / 0.16)" strokeWidth="3" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0, y: 8 }} animate={{ pathLength: 1, opacity: [0, 0.9, 0], y: -10 }}
              transition={{ delay: d(1.0 + i * 0.12), duration: 1.3, ease: 'easeOut' }} />
          ))}
        </svg>

        {/* steel clamp handle */}
        <motion.svg aria-hidden width="150" height="46" viewBox="0 0 150 46" className="-mb-[14px]"
          initial={{ rotate: -38, opacity: 0, y: -16 }} animate={{ rotate: 0, opacity: 1, y: 0 }} style={{ originX: 0.15, originY: 1 }}
          transition={{ delay: d(0.78), type: 'spring', stiffness: 420, damping: 16 }}>
          <defs>
            <linearGradient id="handle" x1="0" x2="1">
              <stop offset="0" style={{ stopColor: 'var(--handle-1)' }} /><stop offset=".3" style={{ stopColor: 'var(--handle-2)' }} /><stop offset=".6" style={{ stopColor: 'var(--handle-3)' }} /><stop offset="1" style={{ stopColor: 'var(--handle-4)' }} />
            </linearGradient>
          </defs>
          <path d="M10 46 V24 Q10 6 30 6 H120 Q140 6 140 24 V46" fill="none" stroke="url(#handle)" strokeWidth="8" strokeLinecap="round" />
        </motion.svg>

        {/* kokum lid */}
        <motion.div {...drop(d(0.56))} className="relative z-10 h-[30px] w-[178px] rounded-b-[8px] rounded-t-[22px] shadow-[0_8px_14px_-8px_rgb(29_28_26/0.45)]" style={{ background: 'var(--enamel-lid)' }}>
          <div className="absolute left-1/2 top-[-9px] h-[12px] w-[34px] -translate-x-1/2 rounded-t-full" style={{ background: 'var(--steel-band)' }} />
        </motion.div>

        <div className="relative flex flex-col items-center gap-[3px]">
          <Tier delay={d(0.38)} enamel="--enamel-3" />
          <Tier delay={d(0.2)} enamel="--enamel-2" h={64}>
            <motion.div className="wordmark-kn absolute inset-0 grid place-items-center pt-1 text-[34px] leading-none"
              style={{ color: 'var(--enamel-engrave)', textShadow: '0 1px 0 rgb(255 255 255 / 0.7), 0 -1px 0 rgb(0 0 0 / 0.3)' }}
              initial={{ clipPath: 'inset(0 100% 0 0)' }} animate={{ clipPath: 'inset(0 0% 0 0)' }}
              transition={{ delay: d(1.0), duration: 0.5, ease: [0.6, 0, 0.2, 1] }}>
              ಊಟ
            </motion.div>
          </Tier>
          <Tier delay={d(0.02)} enamel="--enamel-1" />

          {/* steel side rods lock upward */}
          {[-1, 1].map((s) => (
            <motion.div key={s} aria-hidden className="absolute top-[-34px] h-[calc(100%+36px)] w-[7px] rounded-full"
              style={{ left: s < 0 ? -6 : undefined, right: s > 0 ? -6 : undefined, background: 'var(--steel-band)' }}
              initial={{ scaleY: 0, opacity: 0 }} animate={{ scaleY: 1, opacity: 1 }}
              transition={{ delay: d(0.74), type: 'spring', stiffness: 500, damping: 26 }} />
          ))}

          {/* glint when it locks */}
          <motion.div aria-hidden className="pointer-events-none absolute inset-y-0 -left-2 w-16 -skew-x-12 mix-blend-soft-light"
            style={{ background: 'linear-gradient(90deg, transparent, rgb(255 255 255 / 1), transparent)' }}
            initial={{ x: -40, opacity: 0 }} animate={{ x: 210, opacity: [0, 1, 0] }} transition={{ delay: d(0.9), duration: 0.6, ease: 'easeInOut' }} />
        </div>

        {/* floor shadow */}
        <motion.div aria-hidden className="mt-3 h-4 w-[210px] rounded-[50%] bg-black/15 blur-md"
          initial={{ scaleX: 0.3, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ delay: d(0.1), duration: 0.6 }} />

        <motion.div className="mt-8 text-center" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: d(1.15), duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}>
          <p className="font-display text-[44px] font-semibold leading-none tracking-[-0.035em] text-ink">Oota</p>
          <p className="mt-3 text-[16px] text-ink-2">Bengaluru’s food, sorted to your taste.</p>
        </motion.div>
      </div>

      <button type="button" onClick={(e) => { e.stopPropagation(); finish() }}
        className="absolute bottom-8 right-8 h-10 rounded-full px-4 text-[14px] font-medium text-ink-2 hover:bg-graphite/5 hover:text-ink">
        Skip
      </button>
    </motion.div>
  )
}
