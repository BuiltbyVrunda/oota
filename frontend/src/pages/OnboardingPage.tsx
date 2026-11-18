import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AmbientField } from '../components/common/AmbientField'
import { Wordmark } from '../components/common/Wordmark'
import { CuisineStep } from '../components/onboarding/CuisineStep'
import { DietStep } from '../components/onboarding/DietStep'
import { FlavourStep } from '../components/onboarding/FlavourStep'
import { StepProgress } from '../components/onboarding/StepProgress'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { usePreferences } from '../context/PreferencesContext'
import { useToast } from '../context/ToastContext'
import type { Preferences } from '../types'
import { firstName } from '../utils/format'

const STEPS = [
  { label: 'Cuisines', title: 'What do you love eating?', body: 'Pick at least three. These lead your recommendations.' },
  { label: 'Diet & spice', title: 'How do you eat?', body: 'We never recommend a dish that breaks these rules.' },
  { label: 'Flavours', title: 'What flavours pull you in?', body: 'Optional. Helps us break ties between good options.' },
]

export function OnboardingPage() {
  const { user } = useAuth()
  const { prefs, savePrefs } = usePreferences()
  const { push } = useToast()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [draft, setDraft] = useState<Preferences>(prefs)
  const [busy, setBusy] = useState(false)

  const go = (n: number) => { setDir(n > step ? 1 : -1); setStep(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const finish = async (skipFlavours = false) => {
    setBusy(true)
    await savePrefs({ ...draft, flavours: skipFlavours ? [] : draft.flavours, onboarded: true })
    push({ tone: 'success', title: 'Your tiffin is packed', body: 'Here are the first picks for your taste.' })
    navigate('/', { replace: true })
  }
  const canNext = step !== 0 || draft.cuisineIds.length >= 3
  const s = STEPS[step]

  return (
    <div className="relative min-h-dvh pb-32">
      <AmbientField />
      <div className="mx-auto max-w-[1100px] px-4 pt-6 sm:px-6">
        <div className="flex items-center justify-between">
          <Wordmark />
          <span className="text-[14px] text-ink-3">Hi {user ? firstName(user.fullName) : 'there'} · step {step + 1} of 3</span>
        </div>
        <div className="mt-8"><StepProgress step={step} labels={STEPS.map((x) => x.label)} /></div>

        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.section key={step} custom={dir} aria-labelledby="step-title"
            initial={{ opacity: 0, x: dir * 40 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }} transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
            className="mt-10">
            <h1 id="step-title" className="text-[32px] sm:text-[44px]">{s.title}</h1>
            <p className="mt-2 text-[16px] text-ink-2">{s.body}</p>
            <div className="mt-8">
              {step === 0 && <CuisineStep value={draft.cuisineIds} onChange={(cuisineIds) => setDraft({ ...draft, cuisineIds })} />}
              {step === 1 && <DietStep value={draft} onChange={(v) => setDraft({ ...draft, ...v })} />}
              {step === 2 && <FlavourStep value={draft.flavours} onChange={(flavours) => setDraft({ ...draft, flavours })} />}
            </div>
          </motion.section>
        </AnimatePresence>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 px-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="liquid-lens mx-auto flex max-w-[1100px] items-center gap-3 rounded-full p-2">
          <Button variant="ghost" className="relative z-[2]" onClick={() => go(step - 1)} disabled={step === 0} icon={<ArrowLeft className="size-4" />}>Back</Button>
          <div className="relative z-[2] ml-auto flex items-center gap-2">
            {step === 2 && <Button variant="secondary" onClick={() => finish(true)} disabled={busy}>Skip</Button>}
            {step < 2 ? (
              <Button variant="accent" onClick={() => go(step + 1)} disabled={!canNext} iconRight={<ArrowRight className="size-4" />}>
                {canNext ? 'Next' : `Pick ${3 - draft.cuisineIds.length} more`}
              </Button>
            ) : (
              <Button variant="accent" onClick={() => finish()} loading={busy} iconRight={<Check className="size-4" />}>Show my picks</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
