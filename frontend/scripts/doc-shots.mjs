// Screenshots used in docs/REPORT.md and the explainer PDF. Usage: node scripts/doc-shots.mjs
import { chromium } from 'playwright'
const OUT = '../docs/screenshots'
const BASE = 'http://localhost:5173'
const b = await chromium.launch()
const ctx = async (w = 1440, h = 900) => {
  const c = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
  await c.addInitScript(() => sessionStorage.setItem('oota:v1:splash-seen', '1'))
  return c
}
const shot = async (p, name, path, opts = {}) => {
  await p.goto(BASE + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(opts.wait ?? 1100)
  if (opts.scroll) { await p.mouse.wheel(0, opts.scroll); await p.waitForTimeout(500) }
  await p.screenshot({ path: `${OUT}/${name}.png` })
  console.log('  ', name)
}
for (const [email, who] of [['ananya@oota.demo', 'ananya'], ['rohan@oota.demo', 'rohan'], ['meera@oota.demo', 'meera']]) {
  const c = await ctx(); const p = await c.newPage()
  await p.goto(BASE + '/login'); await p.request.post(BASE + '/api/auth/login', { data: { email, password: 'demo1234' } })
  await shot(p, `dashboard-${who}`, '/')
  if (who === 'ananya') {
    await shot(p, 'restaurant', '/restaurant/kempu-kitchen')
    await shot(p, 'discover', '/discover?q=dosa')
    await shot(p, 'preferences', '/preferences')
  }
  if (who === 'rohan') await shot(p, 'orders', '/orders')
  await c.close()
}
{
  const c = await ctx(); const p = await c.newPage()
  await p.goto(BASE + '/partner/login'); await p.request.post(BASE + '/api/partner/auth/login', { data: { email: 'tuppa-and-co@partner.oota.demo', password: 'demo1234' } })
  await shot(p, 'partner-overview', '/partner'); await shot(p, 'partner-menu', '/partner/menu'); await shot(p, 'partner-orders', '/partner/orders')
  await c.close()
}
{
  const c = await ctx(); const p = await c.newPage()
  await p.goto(BASE + '/admin/login'); await p.request.post(BASE + '/api/admin/auth/login', { data: { email: 'admin@oota.demo', password: 'demo1234' } })
  await shot(p, 'admin-overview', '/admin'); await shot(p, 'admin-restaurants', '/admin/restaurants'); await shot(p, 'admin-live', '/admin/live')
  await c.close()
}
{
  const c = await ctx(); const p = await c.newPage()
  await shot(p, 'login', '/login')
  await c.close()
  const c2 = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p2 = await c2.newPage()
  await p2.goto(BASE + '/login'); await p2.waitForTimeout(1700); await p2.screenshot({ path: `${OUT}/splash.png` }); console.log('   splash')
  await c2.close()
}
await b.close()
