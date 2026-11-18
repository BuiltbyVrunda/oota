import { UtensilsCrossed } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../utils/cn'

interface Props { src: string; alt: string; width: number; height: number; className?: string; imgClassName?: string; eager?: boolean }

/** Photo with shimmer skeleton while loading and a calm fallback if Unsplash fails. */
export function SmartImage({ src, alt, width, height, className, imgClassName, eager }: Props) {
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
  return (
    <div className={cn('relative overflow-hidden bg-ground-2', className)}>
      {state === 'loading' && (
        <div aria-hidden className="absolute inset-0 bg-[length:200%_100%] [animation:shimmer_1.6s_linear_infinite]"
          style={{ backgroundImage: 'linear-gradient(90deg, var(--shimmer-a) 0%, var(--shimmer-b) 50%, var(--shimmer-a) 100%)' }} />
      )}
      {state === 'error' ? (
        <div role="img" aria-label={alt} className="absolute inset-0 grid place-items-center bg-gradient-to-br from-haldi/20 via-kokum/10 to-chilli/20 text-pewter">
          <UtensilsCrossed className="size-6" aria-hidden />
        </div>
      ) : (
        <img src={src} alt={alt} width={width} height={height} loading={eager ? 'eager' : 'lazy'} decoding="async"
          onLoad={() => setState('ok')} onError={() => setState('error')}
          className={cn('size-full object-cover transition-[opacity,transform,filter] duration-500', state === 'ok' ? 'opacity-100 blur-0' : 'opacity-0 blur-md', imgClassName)} />
      )}
    </div>
  )
}
