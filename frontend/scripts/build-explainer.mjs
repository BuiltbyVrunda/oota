// Renders docs/pdf/explainer.html (built by docs/pdf/build_html.py) to docs/Oota-DBMS-Explainer.pdf with Chromium.
// Mermaid is loaded from node_modules so it works offline.  Usage (repo root): node frontend/scripts/build-explainer.mjs
import { chromium } from 'playwright'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const html = resolve(here, '../../docs/pdf/explainer.html')
const out = resolve(here, '../../docs/Oota-DBMS-Explainer.pdf')

const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto(pathToFileURL(html).href, { waitUntil: 'load' })
await page.addScriptTag({ path: resolve(here, '../node_modules/mermaid/dist/mermaid.min.js') })
await page.evaluate(async () => {
  // @ts-expect-error mermaid is a global from the injected script
  window.mermaid.initialize({ startOnLoad: false, theme: 'base', er: { useMaxWidth: true, layoutDirection: 'TB' },
    themeVariables: { fontFamily: 'Geist, system-ui, sans-serif', fontSize: '13px', primaryColor: '#ffffff', primaryBorderColor: '#2aa6f0',
      primaryTextColor: '#1d1c1a', lineColor: '#3c505e', tertiaryColor: '#eef7ff', attributeBackgroundColorOdd: '#f6fbff', attributeBackgroundColorEven: '#ffffff' } })
  // @ts-expect-error see above
  await window.mermaid.run({ querySelector: '.mermaid' })
})
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(400)
await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true,
  displayHeaderFooter: true, headerTemplate: '<span></span>',
  footerTemplate: '<div style="width:100%;font-size:7.5pt;color:#576c7b;padding:0 14mm;display:flex;justify-content:space-between;font-family:system-ui"><span>Oota · DBMS explainer · Vrunda</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>' })
await browser.close()
console.log('wrote', out)
