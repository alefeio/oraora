/**
 * UI-05B — overflow + composição do header/auth no Next.js real.
 * Critério: documentElement.scrollWidth <= clientWidth + 1
 * Header mobile: nav com 3 destinos sem wrap desbalanceado (uma linha de controles).
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
const routes = [
  { path: "/", key: "home", checkHeader: true },
  { path: "/login", key: "login", checkHeader: false },
  { path: "/signup", key: "signup", checkHeader: false },
  { path: "/esqueci-minha-senha", key: "forgot", checkHeader: false },
  { path: "/redefinir-senha", key: "reset", checkHeader: false },
  { path: "/confirme-seu-email", key: "confirm", checkHeader: false },
  { path: "/email-verificado", key: "verified", checkHeader: false },
]
const outDir = path.join(root, "docs/design/evidence/ui-05b")
fs.mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const report = []

for (const route of routes) {
  for (const width of widths) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      deviceScaleFactor: 1,
    })
    await page.goto(`${base}${route.path}`, { waitUntil: "networkidle" })
    await page.waitForTimeout(250)

    const metrics = await page.evaluate((checkHeader) => {
      const doc = document.documentElement
      const header = document.querySelector("header")
      const nav = header?.querySelector('nav[aria-label="Principal"]')
      let headerNav = null
      if (checkHeader && nav) {
        const links = [...nav.querySelectorAll("a")]
        const tops = new Set(links.map((el) => Math.round(el.getBoundingClientRect().top)))
        headerNav = {
          linkCount: links.length,
          singleRow: tops.size <= 1,
          labels: links.map((el) => el.textContent?.trim()),
        }
      }
      const authTitle = document.querySelector("#auth-shell-title")?.textContent?.trim() || null
      return {
        innerWidth: window.innerWidth,
        clientWidth: doc.clientWidth,
        scrollWidth: doc.scrollWidth,
        overflowPass: doc.scrollWidth <= doc.clientWidth + 1,
        authTitle,
        headerNav,
        hasAuthPanel: !!document.querySelector("#auth-shell-title"),
      }
    }, route.checkHeader)

    const shotName = `${route.key}-${width}.png`
    if ([320, 360, 390, 1280].includes(width)) {
      await page.screenshot({
        path: path.join(outDir, shotName),
        fullPage: true,
      })
    }

    const headerPass =
      !route.checkHeader ||
      width >= 768 ||
      (metrics.headerNav?.singleRow === true && (metrics.headerNav?.linkCount || 0) >= 3)

    report.push({
      route: route.path,
      width,
      ...metrics,
      headerPass,
      shot: [320, 360, 390, 1280].includes(width) ? shotName : null,
    })

    await page.close()
  }
}

await browser.close()

const summaryPath = path.join(outDir, "responsive-audit.json")
fs.writeFileSync(summaryPath, JSON.stringify(report, null, 2))
const overflowFails = report.filter((r) => !r.overflowPass)
const headerFails = report.filter((r) => r.headerPass === false)
console.log(
  JSON.stringify(
    {
      total: report.length,
      overflowFails: overflowFails.length,
      headerFails: headerFails.length,
      report,
    },
    null,
    2,
  ),
)
if (overflowFails.length || headerFails.length) process.exitCode = 2
