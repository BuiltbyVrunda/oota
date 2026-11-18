import { Check, ImageOff, Plus, UtensilsCrossed } from 'lucide-react'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError, errorMessage } from '../api/client'
import { endpoints } from '../api/endpoints'
import { EmptyState } from '../components/common/EmptyState'
import { SmartImage } from '../components/common/SmartImage'
import { PageContainer } from '../components/layout/PageContainer'
import { MenuDish } from '../components/restaurant/MenuDish'
import { Button } from '../components/ui/Button'
import { Chip } from '../components/ui/Chip'
import { DietMark } from '../components/ui/DietMark'
import { Input } from '../components/ui/Input'
import { RangeSlider } from '../components/ui/RangeSlider'
import { useCatalog } from '../context/CatalogContext'
import { useToast } from '../context/ToastContext'
import { allergenOptions, flavours } from '../data/flavours'
import { FOOD_PHOTOS, photo } from '../data/images'
import type { Diet, Dish, Flavour } from '../types'
import { cn } from '../utils/cn'

const DIETS: { id: Diet; label: string }[] = [
  { id: 'veg', label: 'Veg' }, { id: 'vegan', label: 'Vegan' }, { id: 'egg', label: 'Egg' }, { id: 'nonveg', label: 'Non-veg' },
]
type Field = 'restaurantId' | 'category' | 'name' | 'description' | 'price' | 'imageUrl' | 'form'

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
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

/**
 * Anyone signed in can add a dish to any restaurant. Saved to PostgreSQL in one transaction
 * (menu section find-or-create + dish insert); the full-text trigger indexes it and every open
 * browser sees it within a second via the live change feed.
 */
export function AddDishPage() {
  const { restaurants, menuOf, bySlug, status } = useCatalog()
  const { push } = useToast()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const preset = bySlug(params.get('restaurant') ?? '')

  const [restaurantId, setRestaurantId] = useState<number | ''>(preset?.id ?? '')
  const [category, setCategory] = useState('')
  const [newCategory, setNewCategory] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [diet, setDiet] = useState<Diet>('veg')
  const [spice, setSpice] = useState<0 | 1 | 2 | 3>(1)
  const [flav, setFlav] = useState<Flavour[]>([])
  const [allergens, setAllergens] = useState<string[]>([])
  const [photoCode, setPhotoCode] = useState<string | null>(null)
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [busy, setBusy] = useState(false)

  const sorted = useMemo(() => [...restaurants].sort((a, b) => a.name.localeCompare(b.name)), [restaurants])
  const restaurant = restaurantId ? restaurants.find((r) => r.id === restaurantId) : undefined
  const sections = useMemo(() => (restaurantId ? [...new Set(menuOf(restaurantId).map((d) => d.category))] : []), [restaurantId, menuOf])
  const imageUrl = photoCode ? photo(photoCode, 320, 320) : undefined

  // live preview uses the same row component as the real menu
  const preview: Dish = {
    id: -1, restaurantId: Number(restaurantId) || 0, category: category || 'New section', cuisineId: restaurant?.cuisineIds[0] ?? 1,
    name: name.trim() || 'Your dish', description: description.trim() || 'A line about what makes it good.',
    price: Number(price) || 0, diet, spiceLevel: spice, flavourTags: flav, allergens, imageUrl: imageUrl ?? '', avgRating: 0, reviewCount: 0,
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!restaurantId) next.restaurantId = 'Pick the restaurant that serves it.'
    if (category.trim().length < 2) next.category = 'Pick a menu section or name a new one.'
    if (name.trim().length < 2) next.name = 'Give the dish a name.'
    const p = Number(price)
    if (!price || !Number.isFinite(p) || p <= 0) next.price = 'Enter a price in rupees, more than ₹0.'
    setErrors(next)
    if (Object.keys(next).length) return
    setBusy(true)
    try {
      const dish = await endpoints.addDish({
        restaurantId: Number(restaurantId), category: category.trim(), name: name.trim(), description: description.trim(),
        price: p, diet, spiceLevel: spice, flavourTags: flav, allergens, ...(imageUrl ? { imageUrl } : {}),
      })
      push({ tone: 'success', title: `${dish.name} is on the menu`, body: `Added to ${restaurant?.name}. Everyone sees it now.` })
      navigate(`/restaurant/${restaurant?.slug}#dish-${dish.id}`)
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields as typeof errors)
      else setErrors({ form: errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  if (status === 'ready' && restaurants.length === 0) {
    return (
      <PageContainer className="pt-20">
        <EmptyState icon={<UtensilsCrossed className="size-6" />} title="No restaurants to add to">The restaurants table is empty right now.</EmptyState>
      </PageContainer>
    )
  }

  return (
    <PageContainer className="pb-16 pt-6 sm:pt-10">
      <h1 className="text-[34px] sm:text-[48px]">Add a dish</h1>
      <p className="mt-1 text-[16px] text-ink-2">Know something great that isn’t listed? Add it — it goes live for everyone straight away.</p>

      <form onSubmit={submit} noValidate className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="liquid flex flex-col gap-8 rounded-tier p-5 sm:p-7">
          <div className="relative z-[2] flex flex-col gap-8">
            <Section title="Where is it served?">
              <label htmlFor="ad-rest" className="sr-only">Restaurant</label>
              <select id="ad-rest" value={restaurantId} onChange={(e) => { setRestaurantId(e.target.value ? Number(e.target.value) : ''); setCategory(''); setNewCategory(false) }}
                aria-invalid={Boolean(errors.restaurantId) || undefined}
                className={cn('h-12 w-full appearance-none rounded-md border bg-brushed px-3.5 text-[16px] text-ink hover:border-seam-strong', errors.restaurantId ? 'border-danger/70' : 'border-seam')}>
                <option value="">Choose a restaurant…</option>
                {sorted.map((r) => <option key={r.id} value={r.id}>{r.name} · {r.area}</option>)}
              </select>
              {errors.restaurantId && <p role="alert" className="text-[13px] text-danger">{errors.restaurantId}</p>}
            </Section>

            {restaurantId !== '' && (
              <Section title="Menu section">
                <div className="flex flex-wrap gap-2">
                  {sections.map((s) => (
                    <Chip key={s} size="sm" selected={!newCategory && category === s} onClick={() => { setNewCategory(false); setCategory(s) }}>{s}</Chip>
                  ))}
                  <Chip size="sm" selected={newCategory} onClick={() => { setNewCategory(true); setCategory('') }} icon={<Plus className="size-3.5" aria-hidden />}>New section</Chip>
                </div>
                {newCategory && <Input label="New section name" hideLabel placeholder="e.g. Specials" value={category} onChange={(e) => setCategory(e.target.value)} maxLength={60} />}
                {errors.category && <p role="alert" className="text-[13px] text-danger">{errors.category}</p>}
              </Section>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
              <Input label="Dish name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} maxLength={120} placeholder="Ghee Pudi Idli" />
              <Input label="Price (₹)" type="number" inputMode="decimal" min={1} value={price} onChange={(e) => setPrice(e.target.value)} error={errors.price} placeholder="120" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ad-desc" className="text-[14px] font-medium text-ink-2">Description <span className="text-ink-3">(optional)</span></label>
              <textarea id="ad-desc" rows={3} maxLength={400} value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Mini idlis tossed in gunpowder podi and hot ghee."
                className="w-full resize-y rounded-md border border-seam bg-brushed px-3.5 py-3 text-[16px] text-ink outline-none focus:border-haldi focus-visible:outline-none" />
              <span className="tabular self-end text-[12px] text-ink-3">{description.length}/400</span>
            </div>

            <Section title="Diet">
              <div role="radiogroup" aria-label="Diet" className="flex flex-wrap gap-2">
                {DIETS.map((d) => (
                  <Chip key={d.id} role="radio" aria-checked={diet === d.id} aria-pressed={undefined} selected={diet === d.id} onClick={() => setDiet(d.id)} icon={<DietMark diet={d.id} />}>{d.label}</Chip>
                ))}
              </div>
            </Section>

            <RangeSlider label="Spice" min={0} max={3} value={spice} onChange={(n) => setSpice(n as 0 | 1 | 2 | 3)} marks={['None', 'Mild', 'Medium', 'Hot']} />

            <Section title="Flavours" hint="up to 5">
              <div className="flex flex-wrap gap-2">
                {flavours.map((f) => {
                  const on = flav.includes(f.id)
                  return <Chip key={f.id} size="sm" selected={on} disabled={!on && flav.length >= 5}
                    onClick={() => setFlav((p) => (on ? p.filter((x) => x !== f.id) : [...p, f.id]))}>{f.label}</Chip>
                })}
              </div>
            </Section>

            <Section title="Contains" hint="allergens">
              <div className="flex flex-wrap gap-2">
                {allergenOptions.map((a) => {
                  const on = allergens.includes(a)
                  return <Chip key={a} size="sm" selected={on} onClick={() => setAllergens((p) => (on ? p.filter((x) => x !== a) : [...p, a]))}>{a.charAt(0).toUpperCase() + a.slice(1)}</Chip>
                })}
              </div>
            </Section>

            <Section title="Photo" hint="optional">
              <div role="radiogroup" aria-label="Photo" className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
                <button type="button" role="radio" aria-checked={photoCode === null} onClick={() => setPhotoCode(null)}
                  className={cn('grid aspect-square place-items-center rounded-[12px] border border-dashed text-pewter', photoCode === null ? 'border-graphite shadow-[0_0_0_3px_var(--haldi)]' : 'border-seam-strong hover:text-ink')}>
                  <ImageOff className="size-5" aria-hidden /><span className="sr-only">No photo</span>
                </button>
                {FOOD_PHOTOS.map((ph) => {
                  const on = photoCode === ph.code
                  return (
                    <button key={ph.code} type="button" role="radio" aria-checked={on} aria-label={ph.label} title={ph.label} onClick={() => setPhotoCode(ph.code)}
                      className={cn('relative aspect-square overflow-hidden rounded-[12px] transition-transform active:scale-95', on ? 'shadow-[0_0_0_2px_var(--graphite),0_0_0_5px_var(--haldi)]' : 'hover:-translate-y-0.5')}>
                      <SmartImage src={photo(ph.code, 160, 160)} alt="" width={160} height={160} className="absolute inset-0" />
                      {on && <span className="haldi-gloss absolute right-1 top-1 grid size-5 place-items-center rounded-full"><Check className="size-3" strokeWidth={3} aria-hidden /></span>}
                    </button>
                  )
                })}
              </div>
            </Section>
            {errors.form && <p role="alert" className="text-[14px] text-danger">{errors.form}</p>}
          </div>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="liquid rounded-tier p-5">
            <div className="relative z-[2]">
              <p className="text-[14px] font-semibold text-ink-3">Preview on {restaurant?.name ?? 'the menu'}</p>
              <div className="mt-3 rounded-card bg-plate-strong">
                <MenuDish d={preview} />
              </div>
              <Button type="submit" variant="accent" size="lg" full className="mt-5" loading={busy} icon={<Plus className="size-4" />}>Add to menu</Button>
              <p className="mt-3 text-center text-[13px] text-ink-3">
                Saved to PostgreSQL · <Link to="/status" className="underline hover:text-ink">watch it arrive live</Link>
              </p>
            </div>
          </div>
        </aside>
      </form>
    </PageContainer>
  )
}
