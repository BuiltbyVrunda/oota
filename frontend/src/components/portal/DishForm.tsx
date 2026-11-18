import { Check, ImageOff, Plus } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { ApiError, errorMessage } from '../../api/client'
import type { DishInput } from '../../api/portal'
import { allergenOptions, flavours } from '../../data/flavours'
import { FOOD_PHOTOS, photo } from '../../data/images'
import type { Diet, Dish, Flavour } from '../../types'
import { cn } from '../../utils/cn'
import { SmartImage } from '../common/SmartImage'
import { MenuDish } from '../restaurant/MenuDish'
import { PhotoUploadTile } from './PhotoUploadTile'
import { Button } from '../ui/Button'
import { Chip } from '../ui/Chip'
import { DietMark } from '../ui/DietMark'
import { Input } from '../ui/Input'
import { RangeSlider } from '../ui/RangeSlider'

const DIETS: { id: Diet; label: string }[] = [
  { id: 'veg', label: 'Veg' }, { id: 'vegan', label: 'Vegan' }, { id: 'egg', label: 'Egg' }, { id: 'nonveg', label: 'Non-veg' },
]
type Field = 'category' | 'name' | 'description' | 'price' | 'imageUrl' | 'form'
const isCatalogue = (url: string) => url.startsWith('https://images.unsplash.com/')
const sameCatalogue = (a: string, b: string) => a.split('?')[0] === b.split('?')[0]

export function FormSection({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1">
        <span className="text-[16px] font-semibold">{title}</span>
        {hint && <span className="ml-2 text-[14px] text-ink-3">{hint}</span>}
      </legend>
      {children}
    </fieldset>
  )
}

/** Create / edit a dish, with a live preview using the same row the public menu uses. */
export function DishForm({ sections, initial, restaurantName, submitLabel, onSubmit }: {
  sections: string[]
  initial?: Partial<Dish> & { isAvailable?: boolean }
  restaurantName: string
  submitLabel: string
  onSubmit: (d: DishInput) => Promise<void>
}) {
  const [category, setCategory] = useState(initial?.category ?? '')
  const [newCategory, setNewCategory] = useState(sections.length === 0)
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [price, setPrice] = useState(initial?.price ? String(initial.price) : '')
  const [diet, setDiet] = useState<Diet>(initial?.diet ?? 'veg')
  const [spice, setSpice] = useState<0 | 1 | 2 | 3>(initial?.spiceLevel ?? 1)
  const [flav, setFlav] = useState<Flavour[]>(initial?.flavourTags ?? [])
  const [allergens, setAllergens] = useState<string[]>(initial?.allergens ?? [])
  // the chosen photo as a URL (catalogue photo or '/uploads/…'); uploads keep their own tile
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl || null)
  const [uploaded, setUploaded] = useState<string | null>(initial?.imageUrl && !isCatalogue(initial.imageUrl) ? initial.imageUrl : null)
  const [available, setAvailable] = useState(initial?.isAvailable ?? true)
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [busy, setBusy] = useState(false)

  const preview: Dish = {
    id: -1, restaurantId: 0, category: category || 'New section', cuisineId: 1, name: name.trim() || 'Your dish',
    description: description.trim() || 'A line about what makes it good.', price: Number(price) || 0, diet, spiceLevel: spice,
    flavourTags: flav, allergens, imageUrl: imageUrl ?? '', avgRating: initial?.avgRating ?? 0, reviewCount: initial?.reviewCount ?? 0,
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (category.trim().length < 2) next.category = 'Pick a menu section or name a new one.'
    if (name.trim().length < 2) next.name = 'Give the dish a name.'
    const p = Number(price)
    if (!price || !Number.isFinite(p) || p <= 0) next.price = 'Enter a price in rupees, more than ₹0.'
    setErrors(next)
    if (Object.keys(next).length) return
    setBusy(true)
    try {
      await onSubmit({ category: category.trim(), name: name.trim(), description: description.trim(), price: p, diet, spiceLevel: spice,
        flavourTags: flav, allergens, isAvailable: available, ...(imageUrl ? { imageUrl } : {}) })
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields as typeof errors)
      else setErrors({ form: errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="liquid rounded-tier p-5 sm:p-7">
        <div className="relative z-[2] flex flex-col gap-8">
          <FormSection title="Menu section">
            <div className="flex flex-wrap gap-2">
              {sections.map((s) => <Chip key={s} size="sm" selected={!newCategory && category === s} onClick={() => { setNewCategory(false); setCategory(s) }}>{s}</Chip>)}
              <Chip size="sm" selected={newCategory} onClick={() => { setNewCategory(true); setCategory('') }} icon={<Plus className="size-3.5" aria-hidden />}>New section</Chip>
            </div>
            {newCategory && <Input label="New section name" hideLabel placeholder="e.g. Specials" value={category} onChange={(e) => setCategory(e.target.value)} maxLength={60} />}
            {errors.category && <p role="alert" className="text-[13px] text-danger">{errors.category}</p>}
          </FormSection>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
            <Input label="Dish name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} maxLength={120} placeholder="Ghee Pudi Idli" />
            <Input label="Price (₹)" type="number" inputMode="decimal" min={1} value={price} onChange={(e) => setPrice(e.target.value)} error={errors.price} placeholder="120" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="df-desc" className="text-[14px] font-medium text-ink-2">Description <span className="text-ink-3">(optional)</span></label>
            <textarea id="df-desc" rows={3} maxLength={400} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Mini idlis tossed in gunpowder podi and hot ghee."
              className="w-full resize-y rounded-md border border-seam bg-brushed px-3.5 py-3 text-[16px] text-ink outline-none focus:border-haldi focus-visible:outline-none" />
            <span className="tabular self-end text-[12px] text-ink-3">{description.length}/400</span>
          </div>

          <FormSection title="Diet">
            <div role="radiogroup" aria-label="Diet" className="flex flex-wrap gap-2">
              {DIETS.map((d) => (
                <Chip key={d.id} role="radio" aria-checked={diet === d.id} aria-pressed={undefined} selected={diet === d.id} onClick={() => setDiet(d.id)} icon={<DietMark diet={d.id} />}>{d.label}</Chip>
              ))}
            </div>
          </FormSection>

          <RangeSlider label="Spice" min={0} max={3} value={spice} onChange={(n) => setSpice(n as 0 | 1 | 2 | 3)} marks={['None', 'Mild', 'Medium', 'Hot']} />

          <FormSection title="Flavours" hint="up to 5">
            <div className="flex flex-wrap gap-2">
              {flavours.map((f) => {
                const on = flav.includes(f.id)
                return <Chip key={f.id} size="sm" selected={on} disabled={!on && flav.length >= 5} onClick={() => setFlav((p) => (on ? p.filter((x) => x !== f.id) : [...p, f.id]))}>{f.label}</Chip>
              })}
            </div>
          </FormSection>

          <FormSection title="Contains" hint="allergens">
            <div className="flex flex-wrap gap-2">
              {allergenOptions.map((a) => {
                const on = allergens.includes(a)
                return <Chip key={a} size="sm" selected={on} onClick={() => setAllergens((p) => (on ? p.filter((x) => x !== a) : [...p, a]))}>{a.charAt(0).toUpperCase() + a.slice(1)}</Chip>
              })}
            </div>
          </FormSection>

          <FormSection title="Photo" hint="optional">
            <div role="radiogroup" aria-label="Photo" className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
              <PhotoUploadTile value={uploaded} selected={imageUrl !== null && imageUrl === uploaded} label="Upload your own dish photo"
                onUploaded={(url) => { setUploaded(url); setImageUrl(url) }} />
              <button type="button" role="radio" aria-checked={imageUrl === null} onClick={() => setImageUrl(null)}
                className={cn('grid aspect-square place-items-center rounded-[12px] border border-dashed text-pewter', imageUrl === null ? 'border-graphite shadow-[0_0_0_3px_var(--haldi)]' : 'border-seam-strong hover:text-ink')}>
                <ImageOff className="size-5" aria-hidden /><span className="sr-only">No photo</span>
              </button>
              {FOOD_PHOTOS.map((ph) => {
                const url = photo(ph.code, 320, 320)
                const on = imageUrl !== null && isCatalogue(imageUrl) && sameCatalogue(imageUrl, url)
                return (
                  <button key={ph.code} type="button" role="radio" aria-checked={on} aria-label={ph.label} title={ph.label} onClick={() => setImageUrl(url)}
                    className={cn('relative aspect-square overflow-hidden rounded-[12px] transition-transform active:scale-95', on ? 'shadow-[0_0_0_2px_var(--graphite),0_0_0_5px_var(--haldi)]' : 'hover:-translate-y-0.5')}>
                    <SmartImage src={photo(ph.code, 160, 160)} alt="" width={160} height={160} className="absolute inset-0" />
                    {on && <span className="haldi-gloss absolute right-1 top-1 grid size-5 place-items-center rounded-full"><Check className="size-3" strokeWidth={3} aria-hidden /></span>}
                  </button>
                )
              })}
            </div>
          </FormSection>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-card bg-plate-strong p-4">
            <span>
              <span className="block text-[16px] font-semibold">Available to order</span>
              <span className="block text-[14px] text-ink-3">Turn off when it’s sold out — diners won’t see it.</span>
            </span>
            <input type="checkbox" role="switch" checked={available} onChange={(e) => setAvailable(e.target.checked)} className="peer sr-only" />
            <span aria-hidden className={cn('relative h-7 w-12 shrink-0 rounded-full border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-graphite', available ? 'border-veg bg-veg/30' : 'border-seam bg-brushed')}>
              <span className={cn('absolute top-0.5 size-5.5 rounded-full shadow-e1 transition-[left,background-color]', available ? 'left-[22px] bg-veg' : 'left-0.5 bg-ink-2')} />
            </span>
          </label>
          {errors.form && <p role="alert" className="text-[14px] text-danger">{errors.form}</p>}
        </div>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="liquid rounded-tier p-5">
          <div className="relative z-[2]">
            <p className="text-[14px] font-semibold text-ink-3">Preview on {restaurantName}</p>
            <div className={cn('mt-3 rounded-card bg-plate-strong', !available && 'opacity-50')}><MenuDish d={preview} /></div>
            <Button type="submit" variant="accent" size="lg" full className="mt-5" loading={busy}>{submitLabel}</Button>
            <p className="mt-3 text-center text-[13px] text-ink-3">Saved to PostgreSQL · diners see it within a second</p>
          </div>
        </div>
      </aside>
    </form>
  )
}
