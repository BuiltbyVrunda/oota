import { Plus, X } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import type { ReviewDraft } from '../../context/ReviewsContext'
import type { Dish, Review } from '../../types'
import { cn } from '../../utils/cn'
import { Button } from '../ui/Button'
import { Chip } from '../ui/Chip'
import { DietMark } from '../ui/DietMark'
import { Modal } from '../ui/Modal'
import { StarInput } from '../ui/StarInput'

const TAGS = ['Value for money', 'Great service', 'Quick', 'Cosy', 'Authentic', 'Generous portions', 'Worth the wait', 'Date night', 'Family friendly', 'Work friendly', 'Crowded', 'Pricey', 'Too spicy', 'Loud']
const MIN = 10
const MAX = 600

interface Props { open: boolean; onClose: () => void; restaurantName: string; menu: Dish[]; existing?: Review; onSubmit: (d: ReviewDraft) => Promise<void> }

export function ReviewModal(props: Props) {
  return (
    <Modal open={props.open} onClose={props.onClose} title={props.existing ? 'Edit your review' : `Rate ${props.restaurantName}`}
      description="Your rating updates this place’s average and reshapes your recommendations straight away.">
      <ReviewForm {...props} />
    </Modal>
  )
}

/** Mounted only while the modal is open, so every open starts from the saved review (or blank). */
function ReviewForm({ onClose, menu, existing, onSubmit }: Props) {
  const [rating, setRating] = useState<number>(existing?.rating ?? 0)
  const [text, setText] = useState(existing?.text ?? '')
  const [tags, setTags] = useState<string[]>(existing?.tags ?? [])
  const [dishRatings, setDishRatings] = useState<ReviewDraft['dishRatings']>(existing?.dishRatings ?? [])
  const [picking, setPicking] = useState(false)
  const [errors, setErrors] = useState<{ rating?: string; text?: string }>({})
  const [busy, setBusy] = useState(false)

  const unpicked = useMemo(() => menu.filter((d) => !dishRatings.some((x) => x.dishId === d.id)), [menu, dishRatings])
  const len = text.trim().length

  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    const next: typeof errors = {}
    if (!rating) next.rating = 'Pick a star rating.'
    if (len < MIN) next.text = `Write at least ${MIN} characters (${MIN - len} to go). Mention a dish you had.`
    setErrors(next)
    if (Object.keys(next).length) return
    setBusy(true)
    await onSubmit({ rating: rating as 1, text: text.trim(), tags, dishRatings })
    setBusy(false)
  }

  return (
      <form onSubmit={submit} noValidate className="flex flex-col gap-7">
        <div>
          <p id="rv-overall" className="text-[15px] font-semibold">Overall</p>
          <div className="mt-1"><StarInput value={rating} onChange={setRating} label="Overall rating" autoFocus /></div>
          {errors.rating && <p role="alert" className="text-[13px] text-danger">{errors.rating}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-semibold">Rate what you ate <span className="font-normal text-ink-3">(optional)</span></p>
          </div>
          <ul className="mt-2 flex flex-col gap-1">
            {dishRatings.map((dr) => {
              const d = menu.find((x) => x.id === dr.dishId)
              if (!d) return null
              return (
                <li key={dr.dishId} className="flex items-center gap-2 rounded-md bg-brushed py-1 pl-3 pr-1">
                  <DietMark diet={d.diet} />
                  <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{d.name}</span>
                  <StarInput size="sm" value={dr.rating} label={`Rating for ${d.name}`} onChange={(v) => setDishRatings((p) => p.map((x) => (x.dishId === d.id ? { ...x, rating: v } : x)))} />
                  <button type="button" aria-label={`Remove ${d.name}`} onClick={() => setDishRatings((p) => p.filter((x) => x.dishId !== d.id))}
                    className="grid size-9 place-items-center rounded-full text-pewter hover:text-ink"><X className="size-4" /></button>
                </li>
              )
            })}
          </ul>
          {picking ? (
            <div className="mt-2 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-md border border-seam p-2">
              {unpicked.map((d) => (
                <Chip key={d.id} size="sm" icon={<DietMark diet={d.diet} />} onClick={() => { setDishRatings((p) => [...p, { dishId: d.id, rating: (rating || 4) as 4 }]); setPicking(false) }}>{d.name}</Chip>
              ))}
            </div>
          ) : unpicked.length > 0 && (
            <button type="button" onClick={() => setPicking(true)} className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-full border border-dashed border-seam-strong px-3 text-[13px] font-medium text-ink-2 hover:border-haldi hover:text-haldi-ink">
              <Plus className="size-3.5" aria-hidden /> Add a dish from this menu
            </button>
          )}
        </div>

        <div>
          <p className="text-[15px] font-semibold">What stood out?</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TAGS.map((t) => <Chip key={t} size="sm" selected={tags.includes(t)} onClick={() => setTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))}>{t}</Chip>)}
          </div>
        </div>

        <div>
          <label htmlFor="rv-text" className="text-[15px] font-semibold">Your review</label>
          <textarea id="rv-text" rows={4} maxLength={MAX} value={text} onChange={(e) => setText(e.target.value)}
            aria-invalid={Boolean(errors.text) || undefined} aria-describedby="rv-count"
            placeholder="The ghee roast was crisp but the chutney ran out…"
            className={cn('mt-2 w-full resize-y rounded-md border bg-brushed px-3.5 py-3 text-[16px] text-ink outline-none focus:border-haldi focus-visible:outline-none',
              errors.text ? 'border-danger/70' : 'border-seam')} />
          <div id="rv-count" className="mt-1 flex justify-between text-[13px]">
            <span className={errors.text ? 'text-danger' : 'text-ink-3'} role={errors.text ? 'alert' : undefined}>{errors.text ?? (len < MIN ? `At least ${MIN} characters` : 'Looks good')}</span>
            <span className={cn('tabular', len > MAX - 40 ? 'text-haldi-ink' : 'text-ink-3')}>{text.length}/{MAX}</span>
          </div>
        </div>
        <div className="sticky -bottom-5 -mx-6 -mb-5 flex justify-end gap-3 border-t border-seam bg-solid-plate/80 px-6 py-4 backdrop-blur-md">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="accent" loading={busy}>{existing ? 'Save changes' : 'Post review'}</Button>
        </div>
      </form>
  )
}
