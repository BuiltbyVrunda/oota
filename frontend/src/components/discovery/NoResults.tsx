import { SearchX, Undo2 } from 'lucide-react'
import { EmptyState } from '../common/EmptyState'
import { Button } from '../ui/Button'
import { Chip } from '../ui/Chip'

const POPULAR = ['ghee roast', 'biryani', 'momos', 'vegan pizza', 'filter coffee', 'masala puri']

export function NoResults({ tab, narrow, relax, onRelax, onPopular }: {
  tab: 'restaurants' | 'dishes'; narrow: string[]; relax: { label: string; count: number } | null; onRelax: () => void; onPopular: (q: string) => void
}) {
  return (
    <EmptyState icon={<SearchX className="size-6" />} title={`No ${tab} match all of that`}
      actions={relax && <Button variant="accent" className="h-auto min-h-11 whitespace-normal py-2.5" onClick={onRelax} icon={<Undo2 className="size-4" />}>{relax.label} · show {relax.count}</Button>}>
      {narrow.length > 0 ? <p>Together, <span className="font-semibold text-ink">{narrow.join(' + ')}</span> is too narrow.</p> : <p>Try a different word, or a dish name.</p>}
      <div className="mt-6">
        <p className="text-[13px] font-semibold text-ink-3">Popular right now</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">{POPULAR.map((q) => <Chip key={q} size="sm" onClick={() => onPopular(q)}>{q}</Chip>)}</div>
      </div>
    </EmptyState>
  )
}
