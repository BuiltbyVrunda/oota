// Screenshot every background option on the dashboard + restaurant page. Usage: node scripts/bg-options.mjs [outDir]
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
const out = process.argv[2] ?? '../docs/theme-options'
mkdirSync(out, { recursive: true })
const ids = ['white', 'saffron', 'leaf', 'kokum', 'rangoli', 'coastal']
const b = await chromium.launch()
for (const id of ids) {
  for (const [label, w, h] of [['desktop', 1440, 1100], ['mobile', 390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' })
    await ctx.addInitScript(() => { sessionStorage.setItem('oota:v1:splash-seen', '1'); localStorage.setItem('oota:v1:session', '1') })
    const p = await ctx.newPage()
    await p.goto(`http://localhost:5173/?bg=${id}`, { waitUntil: 'networkidle' })
    await p.waitForTimeout(1200)
    await p.screenshot({ path: `${out}/${id}-${label}.png` })
    await ctx.close()
  }
}
await b.close()
console.log('done')
