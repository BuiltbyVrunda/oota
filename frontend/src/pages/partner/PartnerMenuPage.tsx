import { Plus, UtensilsCrossed } from 'lucide-react'
import { Link } from 'react-router-dom'
import { errorMessage } from '../../api/client'
import { partnerApi } from '../../api/portal'
import { EmptyState } from '../../components/common/EmptyState'
import { ManagedDishRow } from '../../components/portal/ManagedDishRow'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'
import { useResource } from '../../hooks/useResource'

export function PartnerMenuPage() {
  const r = useResource('partner-menu', partnerApi.menu)
  const { push } = useToast()
  const sections = [...new Set((r.data ?? []).map((d) => d.category))]
  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    try { await fn(); if (ok) push({ tone: 'success', title: ok }); r.refresh() } catch (e) { push({ tone: 'error', title: 'Couldn’t save that', body: errorMessage(e) }) }
  }
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] sm:text-[40px]">Your menu</h1>
          <p className="text-[15px] text-ink-2">Edit prices inline, mark dishes sold out, or add new ones. Diners see changes instantly.</p>
        </div>
        <Link to="/partner/menu/new" className="haldi-gloss inline-flex h-11 items-center gap-2 rounded-full px-5 text-[15px] font-medium"><Plus className="size-4" aria-hidden /> Add a dish</Link>
      </div>
      {r.status === 'error' && <p role="alert" className="rounded-card bg-danger-wash p-4 text-danger">{r.error}</p>}
      {!r.data && r.status === 'loading' && <Skeleton className="h-80 w-full rounded-tier" />}
      {r.data && r.data.length === 0 && (
        <div className="liquid rounded-tier"><div className="relative z-[2]">
          <EmptyState icon={<UtensilsCrossed className="size-6" />} title="Your menu is empty" actions={<Link to="/partner/menu/new" className="haldi-gloss inline-flex h-11 items-center rounded-full px-5 font-medium">Add your first dish</Link>}>
            Add dishes with prices, diet and photos. They go live as soon as your restaurant is approved.
          </EmptyState>
        </div></div>
      )}
      {sections.map((s) => (
        <section key={s} className="liquid rounded-tier px-5 py-4 sm:px-6" aria-labelledby={`sec-${s}`}>
          <div className="relative z-[2]">
            <h2 id={`sec-${s}`} className="text-[22px]">{s}</h2>
            <ul className="divide-y divide-seam">
              {r.data!.filter((d) => d.category === s).map((d) => (
                <ManagedDishRow key={d.id} d={d} editTo={`/partner/menu/${d.id}`}
                  onUpdate={(p) => run(() => partnerApi.updateDish(d.id, p))}
                  onDelete={() => run(() => partnerApi.deleteDish(d.id), `Deleted ${d.name}`)} />
              ))}
            </ul>
          </div>
        </section>
      ))}
    </div>
  )
}
