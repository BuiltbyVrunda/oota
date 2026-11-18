import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, AtSign, KeyRound, UserRound } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { DEMO_PASSWORD } from '../../data/users'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

const DEMOS = [
  { email: 'ananya@oota.demo', name: 'Ananya', note: 'Veg · South Indian' },
  { email: 'rohan@oota.demo', name: 'Rohan', note: 'Biryani · kebabs' },
  { email: 'meera@oota.demo', name: 'Meera', note: 'Vegan · cafés' },
]
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
type Field = 'fullName' | 'email' | 'password' | 'form'

/** Grows/shrinks a block in place so switching modes only adds or removes what differs. */
function Reveal({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 360, damping: 34 }}
          className="overflow-hidden">
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** One form for both modes: email + password persist (and keep what you typed); name and demo diners slide in/out. */
export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const { login, signup } = useAuth()
  const navigate = useNavigate()
  const loc = useLocation()
  const isSignup = mode === 'signup'
  const [v, setV] = useState({ fullName: '', email: '', password: '' })
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [busy, setBusy] = useState(false)
  const [lastMode, setLastMode] = useState(mode)
  if (lastMode !== mode) { setLastMode(mode); setErrors({}) }

  const afterLogin = () => {
    const from = (loc.state as { from?: string } | null)?.from
    navigate(from && !['/login', '/signup'].includes(from) ? from : '/', { replace: true })
  }

  const submit = async (e?: FormEvent, demo?: string) => {
    e?.preventDefault()
    const email = demo ?? v.email
    const password = demo ? DEMO_PASSWORD : v.password
    const next: typeof errors = {}
    if (isSignup && !demo && v.fullName.trim().length < 2) next.fullName = 'Tell us your name (at least 2 letters).'
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter an email like name@example.com.'
    if (!password) next.password = 'Enter your password.'
    else if (isSignup && !demo && password.length < 8) next.password = 'Use at least 8 characters.'
    setErrors(next)
    if (Object.keys(next).length) return
    setBusy(true)
    const res = isSignup && !demo ? await signup(v.fullName, email, password) : await login(email, password)
    setBusy(false)
    if (!res.ok) { setErrors({ [res.field ?? 'form']: res.message }); return }
    if (isSignup && !demo) navigate('/onboarding', { replace: true })
    else afterLogin()
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col">
      <Reveal show={isSignup}>
        <div className="pb-4">
          <Input label="Full name" autoComplete="name" icon={<UserRound className="size-4" />} value={v.fullName}
            onChange={(e) => setV({ ...v, fullName: e.target.value })} error={errors.fullName} placeholder="Vrunda S" />
        </div>
      </Reveal>
      <div className="flex flex-col gap-4">
        <Input label="Email" type="email" autoComplete="email" icon={<AtSign className="size-4" />} value={v.email}
          onChange={(e) => setV({ ...v, email: e.target.value })} error={errors.email} placeholder="you@example.com" />
        <Input label="Password" type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} icon={<KeyRound className="size-4" />}
          value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} error={errors.password}
          hint={isSignup ? '8 characters or more.' : undefined} />
        {errors.form && <p role="alert" className="text-[14px] text-danger">{errors.form}</p>}
        <Button type="submit" variant="accent" size="lg" full loading={busy} iconRight={<ArrowRight className="size-4" />}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              {isSignup ? 'Create account' : 'Log in'}
            </motion.span>
          </AnimatePresence>
        </Button>
      </div>

      <Reveal show={!isSignup}>
        <div className="pt-6">
          <p className="text-[13px] font-medium text-ink-3">Try a demo diner — each one sees a different Oota</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {DEMOS.map((d) => (
              <button key={d.email} type="button" onClick={() => { setV({ ...v, email: d.email, password: DEMO_PASSWORD }); void submit(undefined, d.email) }}
                className="liquid-flat flex min-w-0 flex-col items-start rounded-md px-3 py-2.5 text-left transition-transform hover:-translate-y-0.5 active:scale-95">
                <span className="relative z-[2] text-[14px] font-semibold">{d.name}</span>
                <span className="relative z-[2] w-full truncate text-[12px] text-ink-3">{d.note}</span>
              </button>
            ))}
          </div>
        </div>
      </Reveal>
      <Reveal show={isSignup}>
        <p className="pt-4 text-center text-[13px] text-ink-3">Next, three quick questions about what you like to eat.</p>
      </Reveal>
    </form>
  )
}
