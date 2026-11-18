import { AtSign, Check, KeyRound, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ApiError, errorMessage } from '../../api/client'
import type { NewRestaurant } from '../../api/portal'
import { useCatalog } from '../../context/CatalogContext'
import { areas } from '../../data/areas'
import { PHOTO, photo } from '../../data/images'
import { cn } from '../../utils/cn'
import { SmartImage } from '../common/SmartImage'
import { Button } from '../ui/Button'
import { Chip } from '../ui/Chip'
import { Input } from '../ui/Input'
import { FormSection } from './DishForm'
import { PhotoUploadTile } from './PhotoUploadTile'

const COVERS = Object.keys(PHOTO).map((k) => ({ code: k.slice(0, 3), label: k.slice(4).replace(/_/g, ' ') }))
type Field = keyof NewRestaurant | 'form'

/** Restaurant details + its partner login. Used by partner self sign-up and by admins. */
export function RestaurantForm({ submitLabel, note, onSubmit, ownerLabel = 'Your partner login' }: {
  submitLabel: string; note: string; ownerLabel?: string; onSubmit: (r: NewRestaurant) => Promise<void>
}) {
  const { cuisines } = useCatalog()
  const [v, setV] = useState({ name: '', description: '', area: '', address: '', costForTwo: '', isPureVeg: false, opensAt: '11:00', closesAt: '23:00', ownerName: '', ownerEmail: '', ownerPassword: '' })
  const [cuisineIds, setCuisineIds] = useState<number[]>([])
  const [cover, setCover] = useState<string | null>(null) // a full URL: catalogue photo or '/uploads/…'
  const [uploaded, setUploaded] = useState<string | null>(null)
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (v.name.trim().length < 2) next.name = 'Name the restaurant.'
    if (!v.area) next.area = 'Pick the area.'
    if (v.address.trim().length < 5) next.address = 'Add a street address.'
    if (!(Number(v.costForTwo) > 0)) next.costForTwo = 'Enter the cost for two in rupees.'
    if (!cuisineIds.length) next.cuisineIds = 'Pick at least one cuisine.'
    if (!cover) next.coverUrl = 'Pick a cover photo.'
    if (v.ownerName.trim().length < 2) next.ownerName = 'Who runs it?'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.ownerEmail.trim())) next.ownerEmail = 'Enter an email like name@example.com.'
    if (v.ownerPassword.length < 8) next.ownerPassword = 'At least 8 characters.'
    setErrors(next)
    if (Object.keys(next).length) return
    setBusy(true)
    try {
      await onSubmit({ ...v, name: v.name.trim(), address: v.address.trim(), description: v.description.trim(), costForTwo: Math.round(Number(v.costForTwo)),
        cuisineIds, coverUrl: cover!, ownerName: v.ownerName.trim(), ownerEmail: v.ownerEmail.trim().toLowerCase() })
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields as typeof errors)
      else setErrors({ form: errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <section className="liquid rounded-tier p-5 sm:p-7">
        <div className="relative z-[2] flex flex-col gap-6">
          <h2 className="text-[22px]">The restaurant</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Restaurant name" value={v.name} onChange={set('name')} error={errors.name} placeholder="Neer Dosa Point" maxLength={120} />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="rf-area" className="text-[14px] font-medium text-ink-2">Area</label>
              <select id="rf-area" value={v.area} onChange={set('area')} aria-invalid={Boolean(errors.area) || undefined}
                className={cn('h-12 w-full rounded-md border bg-brushed px-3.5 text-[16px] text-ink', errors.area ? 'border-danger/70' : 'border-seam')}>
                <option value="">Choose…</option>
                {areas.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              {errors.area && <p role="alert" className="text-[13px] text-danger">{errors.area}</p>}
            </div>
          </div>
          <Input label="Street address" value={v.address} onChange={set('address')} error={errors.address} placeholder="12, Lake Road" maxLength={240} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="rf-desc" className="text-[14px] font-medium text-ink-2">What’s it like? <span className="text-ink-3">(optional)</span></label>
            <textarea id="rf-desc" rows={3} maxLength={600} value={v.description} onChange={set('description')} placeholder="Soft neer dosas, coconut chutney ground every hour…"
              className="w-full resize-y rounded-md border border-seam bg-brushed px-3.5 py-3 text-[16px] text-ink outline-none focus:border-haldi focus-visible:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Input label="Cost for two (₹)" type="number" min={1} value={v.costForTwo} onChange={set('costForTwo')} error={errors.costForTwo} placeholder="400" />
            <Input label="Opens" type="time" value={v.opensAt} onChange={set('opensAt')} />
            <Input label="Closes" type="time" value={v.closesAt} onChange={set('closesAt')} />
            <label className="flex h-12 cursor-pointer items-center gap-3 self-end rounded-md border border-seam bg-brushed px-3.5">
              <input type="checkbox" checked={v.isPureVeg} onChange={(e) => setV({ ...v, isPureVeg: e.target.checked })} className="size-5 accent-[var(--veg)]" />
              <span className="text-[15px] font-medium">Pure veg</span>
            </label>
          </div>
          <FormSection title="Cuisines" hint="up to 4">
            <div className="flex flex-wrap gap-2">
              {cuisines.map((c) => {
                const on = cuisineIds.includes(c.id)
                return <Chip key={c.id} size="sm" selected={on} disabled={!on && cuisineIds.length >= 4} onClick={() => setCuisineIds((p) => (on ? p.filter((x) => x !== c.id) : [...p, c.id]))}>{c.name}</Chip>
              })}
            </div>
            {errors.cuisineIds && <p role="alert" className="text-[13px] text-danger">{errors.cuisineIds}</p>}
          </FormSection>
          <FormSection title="Cover photo">
            <div role="radiogroup" aria-label="Cover photo" className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-10">
              <PhotoUploadTile value={uploaded} selected={cover !== null && cover === uploaded} aspect="aspect-[4/3]" label="Upload your own cover photo"
                onUploaded={(url) => { setUploaded(url); setCover(url) }} />
              {COVERS.map((ph) => {
                const url = photo(ph.code, 1200, 700)
                const on = cover === url
                return (
                  <button key={ph.code} type="button" role="radio" aria-checked={on} aria-label={ph.label} title={ph.label} onClick={() => setCover(url)}
                    className={cn('relative aspect-[4/3] overflow-hidden rounded-[10px] transition-transform active:scale-95', on ? 'shadow-[0_0_0_2px_var(--graphite),0_0_0_5px_var(--haldi)]' : 'hover:-translate-y-0.5')}>
                    <SmartImage src={photo(ph.code, 200, 150)} alt="" width={200} height={150} className="absolute inset-0" />
                    {on && <span className="haldi-gloss absolute right-1 top-1 grid size-5 place-items-center rounded-full"><Check className="size-3" strokeWidth={3} aria-hidden /></span>}
                  </button>
                )
              })}
            </div>
            {errors.coverUrl && <p role="alert" className="text-[13px] text-danger">{errors.coverUrl}</p>}
          </FormSection>
        </div>
      </section>

      <section className="liquid rounded-tier p-5 sm:p-7">
        <div className="relative z-[2] flex flex-col gap-4">
          <h2 className="text-[22px]">{ownerLabel}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="Owner / manager name" icon={<UserRound className="size-4" />} value={v.ownerName} onChange={set('ownerName')} error={errors.ownerName} />
            <Input label="Email" type="email" icon={<AtSign className="size-4" />} value={v.ownerEmail} onChange={set('ownerEmail')} error={errors.ownerEmail} autoComplete="email" />
            <Input label="Password" type="password" icon={<KeyRound className="size-4" />} value={v.ownerPassword} onChange={set('ownerPassword')} error={errors.ownerPassword} autoComplete="new-password" hint="8 characters or more." />
          </div>
          {errors.form && <p role="alert" className="text-[14px] text-danger">{errors.form}</p>}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <p className="text-[14px] text-ink-3">{note}</p>
            <Button type="submit" variant="accent" size="lg" loading={busy}>{submitLabel}</Button>
          </div>
        </div>
      </section>
    </form>
  )
}
