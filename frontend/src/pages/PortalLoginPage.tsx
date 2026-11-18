import { ArrowLeft, ArrowRight, AtSign, KeyRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/layout/AuthLayout'
import { Wordmark } from '../components/common/Wordmark'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { usePortalAuth } from '../context/PortalAuthContext'

const COPY = {
  partner: {
    title: 'Oota for Restaurants', body: 'Manage your menu, see your ratings and orders.', badge: 'Partner',
    demo: { email: 'tuppa-and-co@partner.oota.demo', label: 'Tuppa & Co. (demo)' },
  },
  admin: { title: 'Oota Admin', body: 'Manage restaurants, dishes, diners and reviews.', badge: 'Admin', demo: { email: 'admin@oota.demo', label: 'Admin (demo)' } },
}

/** Separate login screen per portal; each talks to its own account table and cookie. */
export function PortalLoginPage() {
  const { role, user, status, login } = usePortalAuth()
  const navigate = useNavigate()
  const c = COPY[role]
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})
  const [busy, setBusy] = useState(false)
  if (status === 'ready' && user) return <Navigate to={`/${role}`} replace />

  const submit = async (e?: FormEvent, demo?: boolean) => {
    e?.preventDefault()
    const em = demo ? c.demo.email : email
    const pw = demo ? 'demo1234' : password
    if (!em.trim() || !pw) { setErrors({ email: em.trim() ? undefined : 'Enter your email.', password: pw ? undefined : 'Enter your password.' }); return }
    setBusy(true)
    const r = await login(em, pw)
    setBusy(false)
    if (!r.ok) { setErrors({ [r.field ?? 'form']: r.message }); return }
    navigate(`/${role}`, { replace: true })
  }

  return (
    <AuthLayout>
      <div className="liquid liquid-strong w-full max-w-[460px] rounded-tier p-6 sm:p-8">
        <div className="relative z-[2] flex flex-col gap-6">
          <div className="flex items-center gap-2.5">
            <Wordmark />
            <span className={role === 'admin' ? 'rounded-full bg-graphite px-2.5 py-1 text-[12px] font-bold uppercase tracking-wide text-on-ink' : 'haldi-gloss rounded-full px-2.5 py-1 text-[12px] font-bold uppercase tracking-wide'}>{c.badge}</span>
          </div>
          <div>
            <h1 className="text-[32px] sm:text-[38px]">{c.title}</h1>
            <p className="mt-2 text-[16px] text-ink-2">{c.body}</p>
          </div>
          <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            <Input label="Email" type="email" autoComplete="username" icon={<AtSign className="size-4" />} value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
            <Input label="Password" type="password" autoComplete="current-password" icon={<KeyRound className="size-4" />} value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
            {errors.form && <p role="alert" className="text-[14px] text-danger">{errors.form}</p>}
            <Button type="submit" variant={role === 'admin' ? 'primary' : 'accent'} size="lg" full loading={busy} iconRight={<ArrowRight className="size-4" />}>Log in</Button>
            <button type="button" onClick={() => void submit(undefined, true)} className="liquid-flat rounded-md px-3 py-2.5 text-left text-[14px] transition-transform hover:-translate-y-0.5">
              <span className="relative z-[2] font-semibold">Use {c.demo.label}</span>
              <span className="relative z-[2] block text-[12px] text-ink-3">{c.demo.email} · demo1234</span>
            </button>
          </form>
          {role === 'partner' && (
            <p className="text-[14px] text-ink-2">New to Oota? <Link to="/partner/signup" className="font-semibold text-haldi-ink underline">List your restaurant</Link></p>
          )}
          <Link to="/login" className="inline-flex items-center gap-1.5 text-[14px] text-ink-3 hover:text-ink"><ArrowLeft className="size-4" aria-hidden /> Diner login</Link>
        </div>
      </div>
    </AuthLayout>
  )
}
