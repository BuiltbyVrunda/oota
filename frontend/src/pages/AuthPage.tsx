import { AnimatePresence, motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { AuthForm } from '../components/auth/AuthForm'
import { AuthSwitcher } from '../components/auth/AuthSwitcher'

const COPY = {
  login: { title: 'Welcome back.', body: 'Your tiffin is packed with picks for today.' },
  signup: { title: 'Eat better in Bengaluru.', body: 'Make an account and Oota starts learning your taste.' },
}

/** Serves both /login and /signup as one mounted component, so switching morphs the card instead of reloading it. */
export function AuthPage() {
  const { pathname } = useLocation()
  const mode = pathname === '/signup' ? 'signup' : 'login'
  return (
    <motion.section layout aria-labelledby="auth-title" className="flex flex-col gap-6" transition={{ type: 'spring', stiffness: 360, damping: 34 }}>
      <div className="min-h-[96px] sm:min-h-[108px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={mode} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }}>
            <h1 id="auth-title" className="text-[34px] sm:text-[40px]">{COPY[mode].title}</h1>
            <p className="mt-2 text-[16px] text-ink-2">{COPY[mode].body}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <AuthSwitcher mode={mode} />
      <AuthForm mode={mode} />
    </motion.section>
  )
}
