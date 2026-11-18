import { Check, RotateCcw } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { BackgroundPicker, BackgroundStrength, CardColourPicker } from '../components/common/BackgroundPicker'
import { PageContainer } from '../components/layout/PageContainer'
import { CuisineStep } from '../components/onboarding/CuisineStep'
import { DietStep } from '../components/onboarding/DietStep'
import { FlavourStep } from '../components/onboarding/FlavourStep'
import { Button } from '../components/ui/Button'
import { useActivity } from '../context/ActivityContext'
import { usePreferences } from '../context/PreferencesContext'
import { useToast } from '../context/ToastContext'
import type { Preferences } from '../types'

function Panel({ title, body, children, tint }: { title: string; body: string; children: ReactNode; tint: string }) {
  return (
    <section className={`liquid ${tint} rounded-tier p-5 sm:p-7`}>
      <div className="relative z-[2]">
        <h2 className="text-[24px]">{title}</h2>
        <p className="mt-1 text-[15px] text-ink-2">{body}</p>
        <div className="mt-6">{children}</div>
      </div>
    </section>
  )
}

export function PreferencesPage() {
  const { prefs, savePrefs } = usePreferences()
  const { searches, clearSearches } = useActivity()
  const { push } = useToast()
  const [draft, setDraft] = useState<Preferences>(prefs)
  const [busy, setBusy] = useState(false)
  const [seen, setSeen] = useState(prefs)
  if (seen !== prefs) { setSeen(prefs); setDraft(prefs) } // saved elsewhere (e.g. taste chips): pick up the new values
  const dirty = JSON.stringify(draft) !== JSON.stringify(prefs)
  const valid = draft.cuisineIds.length >= 1

  const save = async () => {
    setBusy(true)
    await savePrefs({ ...draft, onboarded: true })
    setBusy(false)
    push({ tone: 'success', title: 'Preferences saved', body: 'Your dashboard has been re-ranked.' })
  }

  return (
    <PageContainer className="pb-28 pt-6 sm:pt-10">
      <h1 className="text-[34px] sm:text-[48px]">Your taste</h1>
      <p className="mt-1 text-[16px] text-ink-2">Everything Oota uses to pick for you. Change anything, any time.</p>
      <div className="mt-8 flex flex-col gap-6">
        <Panel tint="tint-kokum" title="Appearance" body="The light behind the glass, how strong it is, and the colour of the glass cards. Saved on this device; applies instantly.">
          <BackgroundPicker />
          <div className="mt-6"><BackgroundStrength /></div>
          <div className="mt-8"><CardColourPicker /></div>
        </Panel>
        <Panel tint="tint-haldi" title="Cuisines" body="These lead your recommendations (30% of every match).">
          <CuisineStep value={draft.cuisineIds} onChange={(cuisineIds) => setDraft({ ...draft, cuisineIds })} min={1} />
        </Panel>
        <Panel tint="tint-leaf" title="Diet, allergens & spice" body="Hard rules. Dishes that break them never appear as picks.">
          <DietStep value={draft} onChange={(v) => setDraft({ ...draft, ...v })} />
        </Panel>
        <Panel tint="tint-kokum" title="Flavours" body="Used to break ties between good options (15% of every match).">
          <FlavourStep value={draft.flavours} onChange={(flavours) => setDraft({ ...draft, flavours })} />
        </Panel>
        <Panel tint="tint-coconut" title="Search history" body={`Your last ${searches.length} searches shape the “Because you searched” tier. They fade by half every 7 days.`}>
          <div className="flex flex-wrap items-center gap-2">
            {searches.slice(0, 12).map((s, i) => <span key={i} className="rounded-full border border-seam px-3 py-1 text-[14px] text-ink-2">{s.query}</span>)}
            {searches.length === 0 && <span className="text-[14px] text-ink-3">No searches yet.</span>}
          </div>
          {searches.length > 0 && <Button variant="danger" size="sm" className="mt-4" icon={<RotateCcw className="size-3.5" />}
            onClick={() => { clearSearches(); push({ tone: 'info', title: 'Search history cleared' }) }}>Clear search history</Button>}
        </Panel>
      </div>
      <div className="fixed inset-x-0 bottom-24 z-20 px-3 md:bottom-6">
        <div className={`liquid-lens mx-auto flex max-w-[640px] items-center gap-3 rounded-full p-2 pl-5 transition-[opacity,transform] duration-300 ${dirty ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'}`}>
          <p className="relative z-[2] flex-1 text-[14px] text-ink-2">{valid ? 'You have unsaved changes' : 'Pick at least one cuisine'}</p>
          <Button variant="ghost" className="relative z-[2]" onClick={() => setDraft(prefs)}>Discard</Button>
          <Button variant="accent" className="relative z-[2]" onClick={() => void save()} disabled={!valid} loading={busy} icon={<Check className="size-4" />}>Save</Button>
        </div>
      </div>
    </PageContainer>
  )
}
