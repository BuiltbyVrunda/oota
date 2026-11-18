import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import type { NewRestaurant, PortalUser } from '../../api/portal'
import { AmbientField } from '../../components/common/AmbientField'
import { Wordmark } from '../../components/common/Wordmark'
import { PageContainer } from '../../components/layout/PageContainer'
import { RestaurantForm } from '../../components/portal/RestaurantForm'
import { usePortalAuth } from '../../context/PortalAuthContext'

/** Self sign-up: restaurant + partner login, pending until an admin approves. */
export function PartnerSignupPage() {
  const { user, status, adopt } = usePortalAuth()
  const navigate = useNavigate()
  if (status === 'ready' && user) return <Navigate to="/partner" replace />
  return (
    <div className="relative min-h-dvh pb-16">
      <AmbientField />
      <PageContainer className="pt-6">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2.5"><Wordmark /><span className="haldi-gloss rounded-full px-2.5 py-1 text-[12px] font-bold uppercase tracking-wide">Partner</span></span>
          <Link to="/partner/login" className="inline-flex items-center gap-1.5 text-[14px] text-ink-2 hover:text-ink"><ArrowLeft className="size-4" aria-hidden /> Partner login</Link>
        </div>
        <h1 className="mt-10 text-[34px] sm:text-[48px]">List your restaurant</h1>
        <p className="measure mt-2 text-[16px] text-ink-2">Tell diners what you serve. An Oota admin checks every listing; you can build your menu while you wait.</p>
        <div className="mt-8">
          <RestaurantForm submitLabel="Create my listing" note="Your listing starts as Pending and goes live after approval."
            onSubmit={async (r: NewRestaurant) => {
              const res = await api.post<{ user: PortalUser }>('/partner/auth/signup', r)
              adopt(res.user)
              navigate('/partner', { replace: true })
            }} />
        </div>
      </PageContainer>
    </div>
  )
}
