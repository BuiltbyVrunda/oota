import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy, Database, Leaf, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { endpoints } from '../api/endpoints'
import { PageContainer } from '../components/layout/PageContainer'
import { useLive } from '../context/LiveContext'
import { useResource } from '../hooks/useResource'
import { cn } from '../utils/cn'
import { relativeTime } from '../utils/format'

const DEMOS: { title: string; sql: string; shell?: boolean }[] = [
  { title: 'Add a dish (watch it appear on Tuppa & Co.)', sql: `INSERT INTO dishes (restaurant_id, category_id, cuisine_id, name, description, price, diet, spice_level, flavour_tags)
SELECT 1, category_id, 1, 'Ghee Pudi Idli', 'Mini idlis in podi and ghee', 120, 'veg', 2, '{spicy,rich}'
FROM menu_categories WHERE restaurant_id = 1 AND name = 'Dosas';` },
  { title: 'Change a price', sql: `UPDATE dishes SET price = 99 WHERE name = 'Ghee Roast Dosa';` },
  { title: 'Delete a restaurant (cascades to its menu)', sql: `DELETE FROM restaurants WHERE slug = 'smash-yard';` },
  { title: 'Drop a table (Saved breaks gracefully)', sql: `DROP TABLE favourite_restaurants;` },
  { title: 'Restore everything', sql: 'cd backend && npm run reset', shell: true },
]

function CopyLine({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button type="button" onClick={() => { void navigator.clipboard?.writeText(text); setDone(true); window.setTimeout(() => setDone(false), 1400) }}
      className="grid size-9 shrink-0 place-items-center rounded-full text-pewter hover:bg-brushed hover:text-ink" aria-label="Copy command">
      {done ? <Check className="size-4 text-veg" /> : <Copy className="size-4" />}
    </button>
  )
}

/** The viva page: both databases, live. Every terminal change re-renders this within ~1s (SSE). */
export function StatusPage() {
  const { connected } = useLive()
  const r = useResource('status', endpoints.status)
  const s = r.data

  return (
    <PageContainer className="pb-16 pt-6 sm:pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[34px] sm:text-[48px]">Live database</h1>
          <p className="mt-1 text-[16px] text-ink-2">PostgreSQL and MongoDB behind Oota, updating as you change them from a terminal.</p>
        </div>
        <span className={cn('inline-flex h-9 items-center gap-2 rounded-full px-4 text-[14px] font-semibold', connected ? 'bg-veg-wash text-veg' : 'bg-danger-wash text-danger')}>
          <span className={cn('size-2 rounded-full', connected ? 'animate-pulse bg-veg' : 'bg-danger')} aria-hidden />
          {connected ? 'Live — listening for changes' : 'Reconnecting…'}
        </span>
      </div>

      {r.status === 'error' && <p role="alert" className="mt-6 rounded-card bg-danger-wash p-4 text-danger">{r.error}</p>}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="liquid tint-coconut rounded-tier p-5 sm:p-6" aria-labelledby="pg-h">
          <div className="relative z-[2]">
            <h2 id="pg-h" className="flex items-center gap-2 text-[22px]"><Database className="size-5 text-coconut" aria-hidden /> PostgreSQL <span className="font-sans text-[14px] font-normal tracking-normal text-ink-3">structured data</span></h2>
            <ul className="mt-4 flex flex-col">
              {[...(s?.tables ?? []), ...(s?.views ?? [])].map((t) => (
                <li key={t.name} className="flex items-center gap-3 border-b border-seam py-2.5 last:border-0">
                  <code className={cn('flex-1 text-[14px]', t.missing ? 'text-danger line-through' : 'text-ink')}>{t.name}{t.name.startsWith('v_') && <span className="ml-2 font-sans text-[12px] text-ink-3">view</span>}</code>
                  {t.missing ? (
                    <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-danger"><TriangleAlert className="size-3.5" aria-hidden /> missing</span>
                  ) : (
                    <motion.span key={t.rows} initial={{ scale: 1.25, color: 'var(--haldi-ink)' }} animate={{ scale: 1, color: 'var(--ink)' }} transition={{ duration: 0.5 }}
                      className="tabular text-[15px] font-semibold">{t.rows.toLocaleString('en-IN')}</motion.span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <section className="liquid tint-leaf rounded-tier p-5 sm:p-6" aria-labelledby="mg-h">
            <div className="relative z-[2]">
              <h2 id="mg-h" className="flex items-center gap-2 text-[22px]"><Leaf className="size-5 text-leaf" aria-hidden /> MongoDB <span className="font-sans text-[14px] font-normal tracking-normal text-ink-3">flexible data</span></h2>
              <ul className="mt-4 flex flex-col">
                {(s?.collections ?? []).map((c) => (
                  <li key={c.name} className="flex items-center gap-3 border-b border-seam py-2.5 last:border-0">
                    <code className="flex-1 text-[14px]">{c.name}</code>
                    <motion.span key={c.docs} initial={{ scale: 1.25, color: 'var(--haldi-ink)' }} animate={{ scale: 1, color: 'var(--ink)' }} transition={{ duration: 0.5 }}
                      className="tabular text-[15px] font-semibold">{c.docs.toLocaleString('en-IN')}</motion.span>
                  </li>
                ))}
                {s?.mongo === 'down' && <li className="py-2 text-danger">MongoDB is not reachable.</li>}
              </ul>
            </div>
          </section>

          <section className="liquid tint-kokum rounded-tier p-5 sm:p-6" aria-labelledby="ev-h">
            <div className="relative z-[2]">
              <h2 id="ev-h" className="text-[22px]">Change feed</h2>
              <p className="text-[14px] text-ink-3">Postgres triggers → NOTIFY, Mongo change streams → this page.</p>
              <ol className="mt-3 flex max-h-72 flex-col gap-1.5 overflow-y-auto" aria-live="polite">
                <AnimatePresence initial={false}>
                  {(s?.events ?? []).slice(0, 14).map((e) => (
                    <motion.li key={e.at + e.table + e.op} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 rounded-md bg-plate-strong px-3 py-2 text-[14px]">
                      <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold uppercase', e.source === 'postgres' ? 'bg-coconut/15 text-ink' : 'bg-leaf/15 text-ink')}>{e.source === 'postgres' ? 'PG' : 'Mongo'}</span>
                      <code className="font-semibold">{e.op}</code>
                      <code className="flex-1 truncate text-ink-2">{e.table}</code>
                      <span className="shrink-0 text-[12px] text-ink-3">{relativeTime(e.at)}</span>
                    </motion.li>
                  ))}
                </AnimatePresence>
                {s && s.events.length === 0 && <li className="text-[14px] text-ink-3">No changes yet. Run one of the commands below.</li>}
              </ol>
            </div>
          </section>
        </div>
      </div>

      <section className="liquid tint-haldi mt-6 rounded-tier p-5 sm:p-6" aria-labelledby="try-h">
        <div className="relative z-[2]">
          <h2 id="try-h" className="text-[22px]">Try it from a terminal</h2>
          <p className="text-[14px] text-ink-3">Open psql with <code className="rounded bg-plate-strong px-1.5 py-0.5">docker exec -it oota-postgres psql -U oota -d oota</code>, paste a line, then look at the app.</p>
          <ul className="mt-4 flex flex-col gap-3">
            {DEMOS.map((d) => (
              <li key={d.title} className="rounded-card bg-plate-strong p-3">
                <div className="flex items-center gap-2">
                  <p className="flex-1 text-[14px] font-semibold">{d.title}</p>
                  <CopyLine text={d.sql} />
                </div>
                <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-[13px] leading-relaxed text-ink-2"><code>{d.shell ? '$ ' : ''}{d.sql}</code></pre>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </PageContainer>
  )
}
