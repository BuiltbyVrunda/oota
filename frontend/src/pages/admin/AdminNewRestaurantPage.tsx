import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { adminApi } from '../../api/portal'
import { RestaurantForm } from '../../components/portal/RestaurantForm'
import { useToast } from '../../context/ToastContext'

export function AdminNewRestaurantPage() {
  const navigate = useNavigate()
  const { push } = useToast()
  return (
    <div className="flex flex-col gap-6">
      <Link to="/admin/restaurants" className="inline-flex items-center gap-1.5 self-start text-[14px] text-ink-3 hover:text-ink"><ArrowLeft className="size-4" aria-hidden /> Restaurants</Link>
      <div>
        <h1 className="text-[32px] sm:text-[40px]">Add a restaurant</h1>
        <p className="text-[15px] text-ink-2">Creates the restaurant, its cuisines and its partner login in one transaction. Admin-added restaurants go live immediately.</p>
      </div>
      <RestaurantForm submitLabel="Create restaurant" ownerLabel="Partner login for the restaurant" note="Share the email and password with the restaurant so they can manage their menu."
        onSubmit={async (r) => {
          await adminApi.createRestaurant(r)
          push({ tone: 'success', title: `${r.name} created`, body: `Partner login: ${r.ownerEmail}` })
          navigate('/admin/restaurants')
        }} />
    </div>
  )
}
