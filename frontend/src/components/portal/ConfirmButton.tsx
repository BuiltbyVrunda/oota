import { Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '../ui/Button'

/** Destructive action with an inline "Are you sure?" step (no modal). */
export function ConfirmButton({ onConfirm, label = 'Delete', confirmLabel = 'Delete', icon = <Trash2 className="size-3.5" />, busy, question = 'Sure?' }: {
  onConfirm: () => void | Promise<void>; label?: string; confirmLabel?: string; icon?: ReactNode; busy?: boolean; question?: string
}) {
  const [asking, setAsking] = useState(false)
  if (!asking) return <Button size="sm" variant="ghost" icon={icon} onClick={() => setAsking(true)}>{label}</Button>
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-[13px] font-medium text-ink-2">{question}</span>
      <Button size="sm" variant="danger" loading={busy} onClick={async () => { await onConfirm(); setAsking(false) }}>{confirmLabel}</Button>
      <Button size="sm" variant="ghost" onClick={() => setAsking(false)}>Cancel</Button>
    </span>
  )
}
