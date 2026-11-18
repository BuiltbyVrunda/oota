import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { partnerApi } from '../../api/portal'
import { DishForm } from '../../components/portal/DishForm'
import { Skeleton } from '../../components/ui/Skeleton'
import { usePortalAuth } from '../../context/PortalAuthContext'
import { useToast } from '../../context/ToastContext'
import { useResource } from '../../hooks/useResource'

/** /partner/menu/new and /partner/menu/:id — only restaurants list food, and only on their own menu. */
export function PartnerDishPage() {
  const { id } = useParams()
  const editing = id !== undefined && id !== 'new'
  const { user } = usePortalAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const r = useResource('partner-menu', partnerApi.menu)
  const sections = [...new Set((r.data ?? []).map((d) => d.category))]
  const dish = editing ? r.data?.find((d) => d.id === Number(id)) : undefined
  if (!r.data) return <Skeleton className="h-96 w-full rounded-tier" />
  if (editing && !dish) return <p role="alert" className="rounded-card bg-danger-wash p-4 text-danger">That dish isn’t on your menu.</p>
  return (
    <div className="flex flex-col gap-6">
      <Link to="/partner/menu" className="inline-flex items-center gap-1.5 self-start text-[14px] text-ink-3 hover:text-ink"><ArrowLeft className="size-4" aria-hidden /> Menu</Link>
      <div>
        <h1 className="text-[32px] sm:text-[40px]">{editing ? `Edit ${dish!.name}` : 'Add a dish'}</h1>
        <p className="text-[15px] text-ink-2">{editing ? 'Changes go live straight away.' : `It appears on ${user?.restaurantName}’s menu straight away.`}</p>
      </div>
      <DishForm key={dish?.id ?? 'new'} sections={sections} initial={dish} restaurantName={user?.restaurantName ?? 'your menu'}
        submitLabel={editing ? 'Save changes' : 'Add to menu'}
        onSubmit={async (d) => {
          if (editing) await partnerApi.updateDish(dish!.id, { ...d, imageUrl: d.imageUrl ?? null })
          else await partnerApi.addDish(d)
          push({ tone: 'success', title: editing ? `Updated ${d.name}` : `${d.name} is on the menu` })
          navigate('/partner/menu')
        }} />
    </div>
  )
}
