// Playwright screenshots of every page at 1440 / 834 / 390. Usage: node scripts/screens.mjs [outDir] [routes...]
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.env.BASE ?? 'http://localhost:5173'
const out = process.argv[2] ?? '../docs/screenshots'
mkdirSync(out, { recursive: true })
const widths = { desktop: 1440, tablet: 834, mobile: 390 }
const only = process.argv.slice(3)

const shots = [
  { name: 'login', path: '/login', user: null },
  { name: 'signup', path: '/signup', user: null },
  { name: 'dashboard-ananya', path: '/', user: 1 },
  { name: 'dashboard-rohan', path: '/', user: 2 },
  { name: 'dashboard-meera', path: '/', user: 3 },
  { name: 'discover', path: '/discover?q=dosa', user: 1 },
  { name: 'discover-empty', path: '/discover?q=sushi&cuisine=udupi', user: 1 },
  { name: 'restaurant', path: '/restaurant/kempu-kitchen', user: 1 },
  { name: 'saved', path: '/saved', user: 2 },
  { name: 'preferences', path: '/preferences', user: 3 },
  { name: 'onboarding', path: '/onboarding', user: 'new' },
].filter((s) => !only.length || only.includes(s.name))

const browser = await chromium.launch()
const errors = []
for (const s of shots) {
  for (const [label, width] of Object.entries(widths)) {
    const ctx = await browser.newContext({ viewport: { width, height: label === 'mobile' ? 844 : 1000 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
    await ctx.addInitScript(({ user }) => {
      sessionStorage.setItem('oota:v1:splash-seen', '1')
      if (user === 'new') {
        localStorage.setItem('oota:v1:users', JSON.stringify([{ id: 99, fullName: 'Vrunda S', email: 'vrunda@example.com', password: 'password1' }]))
        localStorage.setItem('oota:v1:session', '99')
      } else if (user) localStorage.setItem('oota:v1:session', String(user))
      else localStorage.removeItem('oota:v1:session')
    }, { user: s.user })
    const page = await ctx.newPage()
    page.on('pageerror', (e) => errors.push(`${s.name}@${label}: ${e.message}`))
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`${s.name}@${label} console: ${m.text()}`) })
    await page.goto(BASE + s.path, { waitUntil: 'networkidle' })
    await page.waitForTimeout(900)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    if (overflow > 1) errors.push(`${s.name}@${label}: horizontal overflow ${overflow}px`)
    await page.screenshot({ path: `${out}/${s.name}-${label}.png`, fullPage: true })
    await ctx.close()
  }
}
await browser.close()
console.log(errors.length ? errors.join('\n') : 'no errors, no horizontal overflow')
