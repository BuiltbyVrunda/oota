import { errorMessage } from '../../api/client'
import { adminApi } from '../../api/portal'
import { ConfirmButton } from '../../components/portal/ConfirmButton'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'
import { useResource } from '../../hooks/useResource'
import { relativeTime } from '../../utils/format'

export function AdminUsersPage() {
  const r = useResource('admin-users', adminApi.users)
  const { push } = useToast()
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] sm:text-[40px]">Diners</h1>
        <p className="text-[15px] text-ink-2">Deleting a diner removes them from PostgreSQL (cascading saves and orders) and MongoDB (preferences, reviews, history), then re-syncs the ratings they affected.</p>
      </div>
      {r.status === 'error' && <p role="alert" className="rounded-card bg-danger-wash p-4 text-danger">{r.error}</p>}
      {!r.data ? <Skeleton className="h-96 w-full rounded-tier" /> : (
        <section className="liquid rounded-tier px-4 py-2 sm:px-6">
          <ul className="relative z-[2] divide-y divide-seam">
            {r.data.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-plate-strong text-[15px] font-bold" aria-hidden>{u.fullName.charAt(0)}</span>
                <span className="min-w-0 flex-1 basis-56">
                  <span className="block text-[15px] font-semibold">{u.fullName}</span>
                  <span className="block truncate text-[13px] text-ink-3">{u.email} · joined {relativeTime(u.createdAt)}</span>
                </span>
                <span className="tabular text-[13px] text-ink-2">{u.reviews} reviews · {u.saves} saved · {u.orders} orders</span>
                <ConfirmButton question={`Delete ${u.fullName}?`} onConfirm={async () => {
                  try { await adminApi.deleteUser(u.id); push({ tone: 'success', title: `Deleted ${u.fullName}` }); r.refresh() }
                  catch (e) { push({ tone: 'error', title: 'That didn’t work', body: errorMessage(e) }) }
                }} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
