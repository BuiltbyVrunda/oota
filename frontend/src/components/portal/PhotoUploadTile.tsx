import { Check, LoaderCircle, Upload } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { errorMessage } from '../../api/client'
import { uploadImage } from '../../utils/upload'
import { cn } from '../../utils/cn'

/** First tile of a photo picker: upload your own. Shows the uploaded photo (selected) once done. */
export function PhotoUploadTile({ value, selected, onUploaded, aspect = 'aspect-square', label = 'Upload your own photo' }: {
  value: string | null; selected: boolean; onUploaded: (url: string) => void; aspect?: string; label?: string
}) {
  const input = useRef<HTMLInputElement>(null)
  const id = useId()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pick = async (f: File | undefined) => {
    if (!f) return
    setBusy(true); setError(null)
    try { onUploaded(await uploadImage(f)) } catch (e) { setError(errorMessage(e)) } finally { setBusy(false); if (input.current) input.current.value = '' }
  }
  return (
    <div className="contents">
      <input ref={input} id={id} type="file" accept="image/*" className="sr-only" onChange={(e) => void pick(e.target.files?.[0])} />
      <button type="button" onClick={() => input.current?.click()} aria-label={value ? `${label} (uploaded — choose another)` : label} title={error ?? label}
        onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void pick(e.dataTransfer.files?.[0]) }}
        className={cn('relative grid overflow-hidden rounded-[12px] border border-dashed transition-transform active:scale-95', aspect,
          selected ? 'border-transparent shadow-[0_0_0_2px_var(--graphite),0_0_0_5px_var(--haldi)]' : error ? 'border-danger' : 'border-seam-strong hover:-translate-y-0.5 hover:border-haldi')}>
        {value && <img src={value} alt="" className="absolute inset-0 size-full object-cover" />}
        <span className={cn('relative z-[1] flex flex-col items-center justify-center gap-1 p-1 text-center text-[11px] font-semibold leading-tight',
          value ? 'self-end bg-graphite/55 py-1 text-on-photo' : 'text-ink-2')}>
          {busy ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : value ? null : <Upload className="size-5 text-haldi-ink" aria-hidden />}
          {busy ? 'Uploading…' : value ? 'Change' : 'Upload'}
        </span>
        {selected && value && <span className="haldi-gloss absolute right-1 top-1 grid size-5 place-items-center rounded-full"><Check className="size-3" strokeWidth={3} aria-hidden /></span>}
      </button>
      {error && <span role="alert" className="col-span-full text-[13px] text-danger">{error}</span>}
    </div>
  )
}
