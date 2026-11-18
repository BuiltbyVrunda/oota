/** npm run export:seed — writes db/seed/*.json from the Phase-1 mock data (single source of truth for both databases). */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEMO_PASSWORD } from '../src/data/users'
import { buildSeed } from '../src/utils/seed'

const out = resolve(dirname(fileURLToPath(import.meta.url)), '../../db/seed')
mkdirSync(out, { recursive: true })
const now = Date.now()
const s = buildSeed(now)

const write = (name: string, data: unknown) => {
  writeFileSync(`${out}/${name}.json`, JSON.stringify(data, null, 2) + '\n')
  console.log(`  ${name}.json  ${Array.isArray(data) ? data.length + ' rows' : ''}`)
}
console.log(`Exporting seed to ${out}`)
write('meta', { exportedAt: new Date(now).toISOString(), demoPassword: DEMO_PASSWORD, note: 'Timestamps are shifted to "now" at seed time.' })
write('cuisines', s.cuisines)
write('users', s.users)
write('restaurants', s.restaurants)
write('dishes', s.dishes)
write('reviews', s.reviews)
write('preferences', s.demo.map((d) => ({ userId: d.userId, ...d.preferences })))
write('searches', s.demo.flatMap((d) => d.searches.map((x) => ({ userId: d.userId, ...x }))))
write('views', s.demo.flatMap((d) => d.views.map((x) => ({ userId: d.userId, ...x }))))
write('favourites', s.demo.flatMap((d) => d.favourites.map((restaurantId) => ({ userId: d.userId, restaurantId }))))
