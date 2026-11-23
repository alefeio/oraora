import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const outDir = path.resolve(__dirname, "../../evidence/ui-04/refinos");
const base = "http://127.0.0.1:4180/explorations/ui-04/prototype.html";
const widths = [320, 360, 390, 768, 1280, 1440];
const screens = [
  ["encontrar", "vazio"],
  ["encontrar", "lista"],
  ["home", ""],
  ["account", ""],
  ["login", ""],
  ["pedir-bloqueado", ""],
];

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const report = [];

for (const width of widths) {
  const page = await browser.newPage({
    viewport: { width, height: 900 },
    deviceScaleFactor: 1,
  });
  for (const [screen, state] of screens) {
    const url = `${base}?screen=${encodeURIComponent(screen)}${state ? `&state=${encodeURIComponent(state)}` : ""}`;
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(200);
    const metrics = await page.evaluate(() => {
      const chips = document.querySelector(".chips");
      const chipEls = [...document.querySelectorAll(".chip")];
      const first = chipEls[0];
      const last = chipEls[chipEls.length - 1];
      const overflowing = [];
      for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.right > document.documentElement.clientWidth + 1) {
          overflowing.push({
            tag: el.tagName,
            cls: (el.className || "").toString().slice(0, 80),
            right: Math.round(r.right),
            width: Math.round(r.width),
          });
          if (overflowing.length >= 8) break;
        }
      }
      return {
        innerWidth: window.innerWidth,
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        chipsClient: chips ? Math.round(chips.clientWidth) : null,
        chipsScroll: chips ? Math.round(chips.scrollWidth) : null,
        chipCount: chipEls.length,
        chipMinHeight: chipEls.length
          ? Math.min(...chipEls.map((c) => Math.round(c.getBoundingClientRect().height)))
          : null,
        firstLabel: first ? first.textContent.trim() : null,
        lastLabel: last ? last.textContent.trim() : null,
        overflowPass: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
        chipsScrollOnly:
          !chips ||
          chips.scrollWidth > chips.clientWidth + 1 ||
          chips.scrollWidth <= chips.clientWidth + 1,
        overflowing,
      };
    });

    let focusOk = null;
    if (screen === "encontrar" && metrics.chipCount > 0) {
      focusOk = await page.evaluate(async () => {
        const chips = [...document.querySelectorAll(".chip")];
        const first = chips[0];
        const last = chips[chips.length - 1];
        first.focus();
        const firstFocused = document.activeElement === first;
        last.scrollIntoView({ inline: "nearest", block: "nearest" });
        last.focus();
        const lastFocused = document.activeElement === last;
        const outline = getComputedStyle(last).outlineStyle;
        return {
          firstFocused,
          lastFocused,
          lastVisible: last.getBoundingClientRect().left < window.innerWidth,
          focusVisibleOk: outline !== "none" || last.matches(":focus-visible"),
        };
      });
      // Tab through a couple chips
      await page.locator(".chip").first().focus();
      await page.keyboard.press("Tab");
    }

    const row = {
      width,
      screen,
      state,
      ...metrics,
      focusOk,
    };
    report.push(row);

    if (screen === "encontrar" && state === "vazio" && [320, 360, 390].includes(width)) {
      await page.screenshot({
        path: path.join(outDir, `encontrar-fix-${width}.png`),
        fullPage: true,
      });
      await page.screenshot({
        path: path.join(outDir, `encontrar-fix-${width}-viewport.png`),
        fullPage: false,
      });
    }
  }
  await page.close();
}

await browser.close();

const summaryPath = path.join(outDir, "overflow-audit.json");
fs.writeFileSync(summaryPath, JSON.stringify(report, null, 2));
const fails = report.filter((r) => !r.overflowPass);
console.log(
  JSON.stringify(
    {
      total: report.length,
      fails: fails.length,
      failSamples: fails.slice(0, 10),
      encontrar: report.filter((r) => r.screen === "encontrar" && r.state === "vazio"),
    },
    null,
    2,
  ),
);
if (fails.length) process.exitCode = 2;
