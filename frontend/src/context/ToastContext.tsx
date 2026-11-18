import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export interface ToastItem { id: number; title: string; body?: string; tone: 'info' | 'success' | 'error'; action?: { label: string; onClick: () => void } }
interface ToastActions { push: (t: Omit<ToastItem, 'id'>) => void; dismiss: (id: number) => void }

/* Two contexts: actions never change, so the many buttons that call push() don't re-render when a toast appears. */
const Actions = createContext<ToastActions | null>(null)
const List = createContext<ToastItem[]>([])
let seq = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const push = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = seq++
    setToasts((prev) => [...prev.slice(-2), { ...t, id }])
    window.setTimeout(() => dismiss(id), t.tone === 'error' ? 7000 : 4200)
  }, [dismiss])
  const actions = useMemo(() => ({ push, dismiss }), [push, dismiss])
  return (
    <Actions.Provider value={actions}>
      <List.Provider value={toasts}>{children}</List.Provider>
    </Actions.Provider>
  )
}

export function useToast(): ToastActions {
  const v = useContext(Actions)
  if (!v) throw new Error('useToast outside ToastProvider')
  return v
}

export const useToastList = (): ToastItem[] => useContext(List)
