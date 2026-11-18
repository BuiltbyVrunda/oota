import { Plus, SlidersHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCatalog } from '../../context/CatalogContext'
import { usePreferences } from '../../context/PreferencesContext'
import { useToast } from '../../context/ToastContext'
import { flavourLabel, flavours } from '../../data/flavours'
import type { Flavour } from '../../types'
import { Chip } from '../ui/Chip'
import { Popover } from '../ui/Popover'

/** Editable taste chips: remove inline (with undo), add from a popover. Changes re-rank the tiers instantly. */
export function TasteStrip() {
  const { prefs, savePrefs } = usePreferences()
  const { cuisines, cuisineById } = useCatalog()
  const { push } = useToast()

  const removeCuisine = (id: number) => {
    const before = prefs
    void savePrefs({ ...prefs, cuisineIds: prefs.cuisineIds.filter((c) => c !== id) })
    push({ tone: 'info', title: `Removed ${cuisineById(id)?.name}`, body: 'Your picks have been re-ranked.', action: { label: 'Undo', onClick: () => void savePrefs(before) } })
  }
  const removeFlavour = (f: Flavour) => {
    const before = prefs
    void savePrefs({ ...prefs, flavours: prefs.flavours.filter((x) => x !== f) })
    push({ tone: 'info', title: `Removed ${flavourLabel(f)}`, action: { label: 'Undo', onClick: () => void savePrefs(before) } })
  }

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Your tastes">
      {prefs.cuisineIds.map((id) => (
        <Chip key={`c${id}`} size="sm" selected onRemove={() => removeCuisine(id)}>{cuisineById(id)?.name ?? 'Cuisine'}</Chip>
      ))}
      {prefs.flavours.map((f) => <Chip key={f} size="sm" onRemove={() => removeFlavour(f)}>{flavourLabel(f)}</Chip>)}
      <Popover label="Add a taste" trigger={({ open, toggle, id }) => (
        <button type="button" onClick={toggle} aria-expanded={open} aria-controls={id}
          className="inline-flex h-8 items-center gap-1 rounded-full border border-dashed border-seam-strong px-3 text-[13px] font-medium text-ink-2 hover:border-haldi hover:text-haldi-ink">
          <Plus className="size-3.5" aria-hidden /> Add taste
        </button>
      )}>
        <p className="text-[13px] font-semibold text-ink-3">Cuisines</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {cuisines.filter((c) => !prefs.cuisineIds.includes(c.id)).map((c) => (
            <Chip key={c.id} size="sm" onClick={() => void savePrefs({ ...prefs, cuisineIds: [...prefs.cuisineIds, c.id] })}>{c.name}</Chip>
          ))}
        </div>
        <p className="mt-4 text-[13px] font-semibold text-ink-3">Flavours</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {flavours.filter((f) => !prefs.flavours.includes(f.id)).map((f) => (
            <Chip key={f.id} size="sm" onClick={() => void savePrefs({ ...prefs, flavours: [...prefs.flavours, f.id] })}>{f.label}</Chip>
          ))}
        </div>
      </Popover>
      <Link to="/preferences" className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-ink-3 hover:text-ink">
        <SlidersHorizontal className="size-3.5" aria-hidden /> All preferences
      </Link>
    </div>
  )
}
