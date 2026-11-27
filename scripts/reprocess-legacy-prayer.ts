/**
 * PRAYER-VALIDATION-02 — reprocessamento controlado de UMA oração legada.
 *
 * Dry-run (padrão):
 *   npx tsx scripts/reprocess-legacy-prayer.ts --env=local --prayerId=<id>
 *
 * Apply (exige autorização explícita do proprietário):
 *   npx tsx scripts/reprocess-legacy-prayer.ts --env=local --prayerId=<id> \
 *     --apply --confirm=OWNER_AUTHORIZED
 *
 * Preview: use DATABASE_URL do Preview + --env=preview. Nunca Production.
 * Não reprocessa em massa. Não altera status direto no SQL.
 */
import { config as loadEnv } from "dotenv"
import { assertDatabaseWriteAllowed, redactDatabaseTarget } from "../src/lib/db/guards"
import { reprocessLegacyPrayer } from "../src/modules/intercession/reprocess-legacy-prayer"

loadEnv({ path: ".env.local", quiet: true })
loadEnv({ path: ".env", quiet: true })

function arg(name: string): string | undefined {
  const prefix = `--${name}=`
  const hit = process.argv.find((a) => a.startsWith(prefix))
  if (hit) return hit.slice(prefix.length)
  const idx = process.argv.indexOf(`--${name}`)
  if (idx >= 0) return process.argv[idx + 1]
  return undefined
}

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`)
}

async function main() {
  const env = arg("env") ?? "local"
  if (env === "production") {
    console.error("Recusado: Production writes = 0 neste gate.")
    process.exit(2)
  }

  const prayerId = arg("prayerId")
  if (!prayerId) {
    console.error("Informe --prayerId=<uuid>")
    process.exit(2)
  }

  const apply = hasFlag("apply")
  const confirm = arg("confirm")

  const target = assertDatabaseWriteAllowed()
  console.info("reprocess-legacy-prayer")
  console.info("env", env)
  console.info("db", redactDatabaseTarget(target))
  console.info("prayerId", prayerId)
  console.info("mode", apply ? "APPLY" : "DRY_RUN")

  const result = await reprocessLegacyPrayer({
    prayerId,
    apply,
    ownerAuthorization: confirm,
  })

  // Sem corpo da oração no log.
  console.info(JSON.stringify(result, null, 2))

  if (apply && result.applied) {
    console.info("APPLY executado. LEGACY PRAYER APPLY: EXECUTED")
  } else {
    console.info("LEGACY PRAYER APPLY: NOT EXECUTED")
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
