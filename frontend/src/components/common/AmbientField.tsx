import { cn } from '../../utils/cn'

/* Five soft spice lights as plain radial gradients on one fixed layer. No CSS blur, no animation:
   the browser paints it once, so scrolling and the glass above it stay smooth. */
const FIELD = [
  'radial-gradient(60vmax 50vmax at 4% 0%, color-mix(in srgb, var(--amb-a) min(100%, calc(var(--amb-a-o) * var(--amb-k, 1) * 100%)), transparent), transparent 70%)',
  'radial-gradient(52vmax 46vmax at 100% 18%, color-mix(in srgb, var(--amb-b) min(100%, calc(var(--amb-b-o) * var(--amb-k, 1) * 100%)), transparent), transparent 70%)',
  'radial-gradient(56vmax 46vmax at 46% 108%, color-mix(in srgb, var(--amb-c) min(100%, calc(var(--amb-c-o) * var(--amb-k, 1) * 100%)), transparent), transparent 70%)',
  'radial-gradient(40vmax 38vmax at 0% 92%, color-mix(in srgb, var(--amb-d) min(100%, calc(var(--amb-d-o) * var(--amb-k, 1) * 100%)), transparent), transparent 70%)',
  'radial-gradient(34vmax 30vmax at 62% 44%, color-mix(in srgb, var(--amb-e) min(100%, calc(var(--amb-e-o) * var(--amb-k, 1) * 100%)), transparent), transparent 70%)',
].join(', ')

/** Tiny (40px) version of a photo, upscaled: looks like a heavy blur but costs nothing. */
const tiny = (url: string) => url.replace(/w=\d+&h=\d+/, 'w=40&h=28').replace(/q=\d+/, 'q=40')

export function AmbientField({ photo, className }: { photo?: string; className?: string }) {
  return (
    <div aria-hidden className={cn('pointer-events-none fixed inset-0 -z-10 bg-ground', className)}>
      {photo && <img src={tiny(photo)} alt="" className={cn('absolute inset-0 size-full object-cover opacity-35 saturate-150', !photo.includes('images.unsplash.com') && 'scale-110 blur-3xl')} />}
      <div className="absolute inset-0" style={{ backgroundImage: FIELD }} />
      <div className="absolute inset-0" style={{ background: 'var(--amb-pattern)' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--ground) calc(var(--amb-fade) * 100%), transparent) 100%)' }} />
    </div>
  )
}
