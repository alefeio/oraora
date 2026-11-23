/**
 * UI-05A — verificação de overflow do documento na homepage Next.js.
 * Substitui a asserção tautológica chipsScrollOnly do script de protótipo:
 *   !chips || scroll > client || scroll <= client  (sempre true)
 *
 * Critério: documentElement.scrollWidth <= clientWidth + 1
 * Requer app em http://127.0.0.1:3000 (ou BASE_URL).
 */
import { createRequire } from "module"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")
const require = createRequire(import.meta.url)

let chromium
try {
  ;({ chromium } = require("playwright"))
} catch {
  try {
    ;({ chromium } = require(path.join(root, "docs/design/explorations/ui-04/node_modules/playwright")))
  } catch {
    console.error("Playwright não encontrado. Instale com: npm i -D playwright")
    process.exit(2)
  }
}

const base = process.env.BASE_URL || "http://127.0.0.1:3000"
const widths = [320, 360, 390, 768, 1280, 1440]
const outDir = path.join(root, "docs/design/evidence/ui-05a")
fs.mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const report = []

for (const width of widths) {
  const page = await browser.newPage({
    viewport: { width, height: 900 },
    deviceScaleFactor: 1,
  })
  await page.goto(`${base}/`, { waitUntil: "networkidle" })
  await page.waitForTimeout(250)

  const metrics = await page.evaluate(() => {
    const doc = document.documentElement
    return {
      innerWidth: window.innerWidth,
      clientWidth: doc.clientWidth,
      scrollWidth: doc.scrollWidth,
      overflowPass: doc.scrollWidth <= doc.clientWidth + 1,
      h1: document.querySelector("h1")?.textContent?.trim() || null,
      hasHeader: !!document.querySelector("header"),
      hasFooter: !!document.querySelector("footer"),
      ctaCount: document.querySelectorAll('a[href="/encontrar"], a[href="/signup"]').length,
    }
  })

  const focusOk = await page.evaluate(() => {
    const first = document.querySelector('a[href="/encontrar"]')
    if (!first) return { ok: false }
    first.focus()
    const style = getComputedStyle(first)
    return {
      ok: document.activeElement === first,
      outlineOk: style.outlineStyle !== "none" || first.matches(":focus-visible"),
    }
  })

  report.push({ width, ...metrics, focusOk })

  if ([320, 360, 390, 1280].includes(width)) {
    await page.screenshot({
      path: path.join(outDir, `home-${width}-viewport.png`),
      fullPage: false,
    })
    await page.screenshot({
      path: path.join(outDir, `home-${width}.png`),
      fullPage: true,
    })
  }

  await page.close()
}

await browser.close()

const summaryPath = path.join(outDir, "responsive-audit.json")
fs.writeFileSync(summaryPath, JSON.stringify(report, null, 2))
const fails = report.filter((r) => !r.overflowPass)
console.log(JSON.stringify({ total: report.length, fails: fails.length, report }, null, 2))
if (fails.length) process.exitCode = 2
