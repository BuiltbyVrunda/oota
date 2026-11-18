import { cn } from '../../utils/cn'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('rounded-md bg-[length:200%_100%] [animation:shimmer_1.6s_linear_infinite]', className)}
      style={{ backgroundImage: 'linear-gradient(90deg, var(--shimmer-a) 0%, var(--shimmer-b) 50%, var(--shimmer-a) 100%)' }} />
  )
}
