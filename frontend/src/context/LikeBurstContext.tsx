import { animate, motion, useMotionValue, useReducedMotion } from 'framer-motion'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface Point { x: number; y: number }
/** `target` is read every frame, so the heart lands on the button even if the page scrolls or shifts mid-flight. */
type BurstFn = (from: Point, target: () => Point | null, onArrive: () => void) => void
interface Burst { id: number; from: Point; target: () => Point | null; onArrive: () => void }

const Ctx = createContext<BurstFn | null>(null)
let seq = 1
const SIZE = 104 // px, the heart at full size

/**
 * The "like" animation (modelled on the double-tap heart in the reference recording):
 *  1. pop   — the heart springs up from nothing at the tap point, tilted left, overshoots and settles (~0.3s)
 *  2. float — it drifts up a little (~0.12s)
 *  3. fly   — one continuous quadratic-Bézier arc into the heart button while shrinking and straightening (~0.45s)
 * Everything runs on GPU transforms (translate/scale/rotate) driven by motion values — no layout work per frame.
 */
export function LikeBurstProvider({ children }: { children: ReactNode }) {
  const [bursts, setBursts] = useState<Burst[]>([])
  const reduce = useReducedMotion()
  const burst = useCallback<BurstFn>((from, target, onArrive) => {
    if (reduce) { onArrive(); return }
    setBursts((b) => [...b, { id: seq++, from, target, onArrive }])
  }, [reduce])
  const done = useCallback((id: number) => setBursts((list) => list.filter((x) => x.id !== id)), [])
  return (
    <Ctx.Provider value={burst}>
      {children}
      {createPortal(
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
          {bursts.map((b) => <FlyingHeart key={b.id} b={b} onDone={done} />)}
        </div>,
        document.body,
      )}
    </Ctx.Provider>
  )
}

const ease = [0.45, 0, 0.2, 1] as const // gentle start, decisive landing

function FlyingHeart({ b, onDone }: { b: Burst; onDone: (id: number) => void }) {
  const x = useMotionValue(b.from.x)
  const y = useMotionValue(b.from.y)
  const scale = useMotionValue(0)
  const rotate = useMotionValue(-18)
  const opacity = useMotionValue(1)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return // StrictMode double-invoke guard
    started.current = true
    const controls: { stop: () => void }[] = []
    const run = async () => {
      // 1. pop: overshoot then settle
      controls.push(animate(rotate, -9, { duration: 0.32, ease: 'easeOut' }))
      await animate(scale, [0, 1.22, 0.95, 1], { duration: 0.32, times: [0, 0.5, 0.78, 1], ease: 'easeOut' })
      // 2. float up a touch
      await animate(y, b.from.y - 16, { duration: 0.12, ease: 'easeOut' })
      // 3. fly along an arc to the live target
      const start = { x: x.get(), y: y.get() }
      await animate(0, 1, {
        duration: 0.46,
        ease,
        onUpdate: (t) => {
          const to = b.target() ?? start
          // control point: a little past the start toward the target, lifted above both → a soft arc
          const c = { x: start.x + (to.x - start.x) * 0.3, y: Math.min(start.y, to.y) - 60 }
          const u = 1 - t
          x.set(u * u * start.x + 2 * u * t * c.x + t * t * to.x)
          y.set(u * u * start.y + 2 * u * t * c.y + t * t * to.y)
          scale.set(1 - 0.8 * t)
          rotate.set(-9 * u)
        },
      })
      b.onArrive()
      await animate(opacity, 0, { duration: 0.08 })
      onDone(b.id)
    }
    void run()
    return () => controls.forEach((c) => c.stop())
  }, [b, onDone, opacity, rotate, scale, x, y])

  return (
    <motion.div
      className="absolute left-0 top-0 will-change-transform"
      style={{ x, y, scale, rotate, opacity, width: SIZE, height: SIZE, marginLeft: -SIZE / 2, marginTop: -SIZE / 2 }}
    >
      <svg viewBox="0 0 100 92" className="size-full drop-shadow-[0_10px_24px_rgb(255_45_111/0.45)]">
        <defs>
          <linearGradient id="like-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--like-a)' }} />
            <stop offset="1" style={{ stopColor: 'var(--like-b)' }} />
          </linearGradient>
        </defs>
        <path d="M50 88C47 85.6 6 60.5 6 30.5 6 15.3 17.6 5 31 5c8.3 0 15.2 4.4 19 11 3.8-6.6 10.7-11 19-11 13.4 0 25 10.3 25 25.5C94 60.5 53 85.6 50 88Z" fill="url(#like-fill)" />
        <ellipse cx="30" cy="25" rx="11" ry="7" transform="rotate(-30 30 25)" fill="rgb(255 255 255 / 0.35)" />
      </svg>
    </motion.div>
  )
}

export function useLikeBurst(): BurstFn {
  const v = useContext(Ctx)
  if (!v) throw new Error('useLikeBurst outside LikeBurstProvider')
  return v
}

/** Fired by double-tap surfaces (e.g. the restaurant cover photo); the matching SaveButton handles it. */
export const LIKE_EVENT = 'oota:like'
export interface LikeEventDetail { restaurantId: number; x: number; y: number }
