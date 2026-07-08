import { chromium } from 'playwright'

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173'
const widths = [320, 375, 390, 414, 768]

const browser = await chromium.launch()
let failed = false
for (const w of widths) {
  const page = await browser.newPage({ viewport: { width: w, height: 800 } })
  await page.goto(`${BASE}/about`, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(1200)
  const result = await page.evaluate(() => {
    const cw = document.documentElement.clientWidth
    const sw = document.documentElement.scrollWidth
    const offenders = []
    for (const el of document.querySelectorAll('*')) {
      const style = getComputedStyle(el)
      if (style.position === 'fixed' || style.position === 'sticky') continue
      if (el.scrollWidth > cw + 1) {
        offenders.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className?.toString?.() || '').slice(0, 80),
          scrollWidth: el.scrollWidth,
        })
      }
    }
    return { cw, sw, overflow: sw > cw, offenders: offenders.slice(0, 5) }
  })
  const status = result.overflow ? 'FAIL' : 'OK'
  if (result.overflow) failed = true
  console.log(`${status} ${w}px: scroll=${result.sw} client=${result.cw}`, result.overflow ? result.offenders : '')
  await page.close()
}
await browser.close()
process.exit(failed ? 1 : 0)
