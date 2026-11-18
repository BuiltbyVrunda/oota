import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '../../utils/cn'

interface Props extends InputHTMLAttributes<HTMLInputElement> { label: string; error?: string; hint?: string; icon?: ReactNode; hideLabel?: boolean }

export const Input = forwardRef<HTMLInputElement, Props>(function Input({ label, error, hint, icon, hideLabel, className, type, id, ...rest }, ref) {
  const auto = useId()
  const inputId = id ?? auto
  const [show, setShow] = useState(false)
  const isPw = type === 'password'
  const msgId = `${inputId}-msg`
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className={cn('text-[14px] font-medium text-ink-2', hideLabel && 'sr-only')}>{label}</label>
      <div className={cn(
        'group relative flex h-12 items-center gap-2.5 rounded-md border bg-brushed px-3.5 transition-colors',
        'focus-within:border-haldi focus-within:bg-plate-strong',
        error ? 'border-danger/70' : 'border-seam hover:border-seam-strong',
      )}>
        {icon && <span className="text-pewter group-focus-within:text-haldi" aria-hidden>{icon}</span>}
        <input
          ref={ref}
          id={inputId}
          type={isPw && show ? 'text' : type}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error || hint ? msgId : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none focus-visible:outline-none"
          {...rest}
        />
        {isPw && (
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}
            className="-mr-1 grid size-9 place-items-center rounded-full text-pewter hover:text-ink">
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {(error || hint) && (
        <p id={msgId} className={cn('text-[13px]', error ? 'text-danger' : 'text-ink-3')} role={error ? 'alert' : undefined}>{error ?? hint}</p>
      )}
    </div>
  )
})
