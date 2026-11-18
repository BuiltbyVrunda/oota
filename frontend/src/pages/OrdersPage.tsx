import { Check, ReceiptText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { endpoints, type Order, type OrderStatus } from '../api/endpoints'
import { EmptyState } from '../components/common/EmptyState'
import { SmartImage } from '../components/common/SmartImage'
import { PageContainer } from '../components/layout/PageContainer'
import { ConfirmButton } from '../components/portal/ConfirmButton'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { useToast } from '../context/ToastContext'
import { useResource } from '../hooks/useResource'
import { cn } from '../utils/cn'
import { inr, relativeTime } from '../utils/format'

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'PLACED', label: 'Placed' }, { key: 'PREPARING', label: 'Preparing' }, { key: 'DELIVERED', label: 'Delivered' },
]

/** Placed → Preparing → Delivered. The restaurant moves it along; this page updates live. */
function Progress({ status }: { status: OrderStatus }) {
  if (status === 'CANCELLED') return <span className="rounded-full bg-danger-wash px-2.5 py-1 text-[12px] font-bold text-danger">Cancelled</span>
  const at = STEPS.findIndex((s) => s.key === status)
  return (
    <ol className="flex items-center gap-1.5" aria-label={`Status: ${STEPS[at]?.label}`}>
      {STEPS.map((s, i) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span className={cn('inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[12px] font-semibold transition-colors',
            i < at ? 'bg-veg-wash text-veg' : i === at ? (status === 'DELIVERED' ? 'bg-veg text-on-ink' : 'haldi-gloss') : 'bg-brushed text-ink-3')}>
            {i < at || status === 'DELIVERED' ? <Check className="size-3" strokeWidth={3} aria-hidden /> : null}{s.label}
          </span>
          {i < STEPS.length - 1 && <span aria-hidden className={cn('h-0.5 w-4 rounded-full', i < at ? 'bg-veg' : 'bg-seam')} />}
        </li>
      ))}
    </ol>
  )
}

function OrderCard({ o, onCancel }: { o: Order; onCancel: () => Promise<void> }) {
  return (
    <li className="liquid-flat flex flex-col gap-3 rounded-card p-4 sm:flex-row sm:items-center">
      <SmartImage src={o.coverUrl ?? ''} alt={o.restaurantName ?? ''} width={1200} height={700} className="relative z-[2] h-20 w-full shrink-0 rounded-[12px] sm:w-28" />
      <div className="relative z-[2] min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Link to={`/restaurant/${o.restaurantSlug}`} className="text-[17px] font-semibold hover:underline">{o.restaurantName}</Link>
          <span className="tabular font-display text-[20px] font-semibold">{inr(o.total)}</span>
        </div>
        <p className="text-[14px] text-ink-2">{(o.items ?? []).map((i) => `${i.quantity}× ${i.name}`).join(', ')}</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <Progress status={o.status} />
          <span className="flex items-center gap-2 text-[13px] text-ink-3">
            #{o.id} · {relativeTime(o.placedAt)}
            {o.status === 'PLACED' && <ConfirmButton label="Cancel" confirmLabel="Cancel order" question="Cancel?" icon={null} onConfirm={onCancel} />}
          </span>
        </div>
      </div>
    </li>
  )
}

export function OrdersPage() {
  const r = useResource('my-orders', endpoints.myOrders)
  const { push } = useToast()
  const active = (r.data ?? []).filter((o) => o.status === 'PLACED' || o.status === 'PREPARING')
  const past = (r.data ?? []).filter((o) => o.status === 'DELIVERED' || o.status === 'CANCELLED')
  const cancel = (o: Order) => async () => {
    try { await endpoints.cancelOrder(o.id); push({ tone: 'info', title: `Order #${o.id} cancelled` }); r.refresh() }
    catch (e) { push({ tone: 'error', title: 'Couldn’t cancel', body: errorMessage(e) }); r.refresh() }
  }
  return (
    <PageContainer className="pt-6 sm:pt-10">
      <h1 className="text-[34px] sm:text-[48px]">Orders</h1>
      <p className="mt-1 text-[16px] text-ink-2">Your tiffins, live from the kitchen.</p>
      {r.status === 'error' && <p role="alert" className="mt-6 rounded-card bg-danger-wash p-4 text-danger">{r.error}</p>}
      {!r.data && r.status === 'loading' && <Skeleton className="mt-8 h-64 w-full rounded-tier" />}
      {r.data && r.data.length === 0 && (
        <div className="liquid mt-8 rounded-tier"><div className="relative z-[2]">
          <EmptyState icon={<ReceiptText className="size-6" />} title="No orders yet" actions={<Link to="/discover"><Button variant="accent">Find something to eat</Button></Link>}>
            Tap ADD on any dish to start a tiffin.
          </EmptyState>
        </div></div>
      )}
      {active.length > 0 && (
        <section className="liquid tint-haldi mt-8 rounded-tier p-4 sm:p-6" aria-labelledby="active-h">
          <h2 id="active-h" className="relative z-[2] mb-3 text-[22px]">On the way</h2>
          <ul className="relative z-[2] flex flex-col gap-3">{active.map((o) => <OrderCard key={o.id} o={o} onCancel={cancel(o)} />)}</ul>
        </section>
      )}
      {past.length > 0 && (
        <section className="liquid mt-6 rounded-tier p-4 sm:p-6" aria-labelledby="past-h">
          <h2 id="past-h" className="relative z-[2] mb-3 text-[22px]">Past orders</h2>
          <ul className="relative z-[2] flex flex-col gap-3">{past.map((o) => <OrderCard key={o.id} o={o} onCancel={cancel(o)} />)}</ul>
        </section>
      )}
    </PageContainer>
  )
}
