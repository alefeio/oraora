import fs from "fs"

function load(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"))
}

function summarize(label, a) {
  const meta = a.metadata?.vulnerabilities || {}
  const vulns = a.vulnerabilities || {}
  const rank = { critical: 0, high: 1, moderate: 2, low: 3 }
  const rows = Object.entries(vulns)
    .map(([name, v]) => {
      const vias = (v.via || []).filter((x) => typeof x === "object")
      return {
        name,
        severity: v.severity,
        range: v.range,
        isDirect: v.isDirect,
        fixAvailable: v.fixAvailable,
        effects: v.effects,
        advisories: vias.map((x) => ({
          id: (x.url || "").split("/").pop(),
          title: x.title,
          severity: x.severity,
          range: x.range,
          url: x.url,
        })),
      }
    })
    .sort(
      (a, b) =>
        (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9) || a.name.localeCompare(b.name),
    )
  console.log(`=== ${label} ===`)
  console.log(JSON.stringify(meta))
  for (const r of rows) {
    console.log(
      [r.severity, r.name, r.isDirect ? "direct" : "transitive", r.range, `fix=${JSON.stringify(r.fixAvailable)}`].join(
        " | ",
      ),
    )
    for (const adv of r.advisories) {
      console.log(`   - ${adv.id} ${adv.title} (${adv.range})`)
    }
  }
  return { meta, rows }
}

const all = load("docs/security/sec-02-audit-all.json")
const prod = load("docs/security/sec-02-audit-prod.json")
const index = { all: summarize("ALL", all), prod: summarize("PROD omit=dev", prod) }
fs.writeFileSync("docs/security/sec-02-audit-index.json", JSON.stringify(index, null, 2))
