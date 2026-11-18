import { ReceiptText } from 'lucide-react'
import { errorMessage } from '../../api/client'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../context/ToastContext'
import { partnerApi } from '../../api/portal'
import { EmptyState } from '../../components/common/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useResource } from '../../hooks/useResource'
import { inr, relativeTime } from '../../utils/format'

export function PartnerOrdersPage() {
  const r = useResource('partner-orders', partnerApi.orders)
  const { push } = useToast()
  const move = (id: number, status: 'PREPARING' | 'DELIVERED' | 'CANCELLED') => async () => {
    try { await partnerApi.setOrderStatus(id, status); r.refresh() } catch (e) { push({ tone: 'error', title: 'Couldn’t update the order', body: errorMessage(e) }); r.refresh() }
  }
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] sm:text-[40px]">Orders</h1>
        <p className="text-[15px] text-ink-2">New orders appear here live. Move them along — the diner sees each step. Totals are computed by a PostgreSQL trigger.</p>
      </div>
      {r.status === 'error' && <p role="alert" className="rounded-card bg-danger-wash p-4 text-danger">{r.error}</p>}
      {!r.data ? <Skeleton className="h-64 w-full rounded-tier" /> : r.data.length === 0 ? (
        <div className="liquid rounded-tier"><div className="relative z-[2]"><EmptyState icon={<ReceiptText className="size-6" />} title="No orders yet" /></div></div>
      ) : (
        <section className="liquid rounded-tier px-5 py-2 sm:px-6"><ul className="relative z-[2] divide-y divide-seam">
          {r.data.map((o) => (
            <li key={o.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3">
              <span className="tabular w-16 text-[14px] font-semibold text-ink-3">#{o.id}</span>
              <span className="min-w-0 flex-1 basis-60">
                <span className="block text-[15px] font-semibold">{o.customer}</span>
                <span className="block text-[14px] text-ink-2">{o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</span>
              </span>
              <span className="text-[13px] text-ink-3">{relativeTime(o.placedAt)}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${o.status === 'PLACED' ? 'bg-haldi-wash text-haldi-ink' : o.status === 'PREPARING' ? 'bg-coconut/15' : o.status === 'CANCELLED' ? 'bg-danger-wash text-danger' : 'bg-veg-wash text-veg'}`}>{o.status}</span>
              <span className="flex gap-1">
                {o.status === 'PLACED' && <Button size="sm" variant="secondary" onClick={move(o.id, 'PREPARING')}>Start preparing</Button>}
                {o.status === 'PREPARING' && <Button size="sm" variant="secondary" onClick={move(o.id, 'DELIVERED')}>Mark delivered</Button>}
                {(o.status === 'PLACED' || o.status === 'PREPARING') && <Button size="sm" variant="ghost" onClick={move(o.id, 'CANCELLED')}>Cancel</Button>}
              </span>
              <span className="tabular w-20 text-right text-[16px] font-semibold">{inr(o.total)}</span>
            </li>
          ))}
        </ul></section>
      )}
    </div>
  )
}
