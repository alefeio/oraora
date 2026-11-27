/**
 * PRAYER-VALIDATION-02R — reprocessamento controlado de UMA oração legada.
 *
 * Dry-run (padrão):
 *   npx tsx scripts/reprocess-legacy-prayer.ts --env=local --prayerId=<id>
 *
 * Preview dry-run (prova destino efetivo; sem escrita):
 *   npx tsx scripts/reprocess-legacy-prayer.ts --env=preview --prayerId=<id>
 *
 * Apply (local ou Preview) exige OWNER_AUTHORIZED + proveEffectivePrismaWriteTarget.
 * Neste gate: NÃO aplicar no Preview.
 *
 * Não reprocessa em massa. Não altera Production.
 * Não libera manual_review da política V2 automaticamente.
 */
import { config as loadEnv } from "dotenv"
import { assertDatabaseWriteAllowed, redactDatabaseTarget } from "../src/lib/db/guards"
import { prisma } from "../src/lib/db/prisma"
import {
  PREVIEW_DIRECT_FINGERPRINT,
  PREVIEW_POOLED_FINGERPRINT,
  proveEffectivePrismaWriteTarget,
} from "../src/lib/db/write-target"
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
  const requirePreview = env === "preview"

  if (apply && requirePreview) {
    console.error(
      "LEGACY APPLY no Preview bloqueado neste gate (PRAYER-VALIDATION-02R). Use dry-run.",
    )
    process.exit(2)
  }

  const target = assertDatabaseWriteAllowed()
  console.info("reprocess-legacy-prayer")
  console.info("env", env)
  console.info("db_guard", redactDatabaseTarget(target))
  console.info("prayerId", prayerId)
  console.info("mode", apply ? "APPLY" : "DRY_RUN")

  const proof = await proveEffectivePrismaWriteTarget(prisma, {
    requirePreview,
    expectedPreviewFingerprints: [PREVIEW_DIRECT_FINGERPRINT, PREVIEW_POOLED_FINGERPRINT],
  })
  console.info("prisma_effective_target", {
    runtimeFingerprint: proof.runtime.fingerprint,
    runtimeSource: proof.runtime.source,
    runtimeHost: proof.runtime.host,
    runtimeDatabase: proof.runtime.database,
    pooled: proof.runtime.pooled,
    directFingerprint: proof.direct.fingerprint,
    liveDatabase: proof.liveDatabase,
    authorizedPreview: proof.authorizedPreview,
    authorizedLocal: proof.authorizedLocal,
  })

  if (apply) {
    const recheck = await proveEffectivePrismaWriteTarget(prisma, {
      requirePreview,
      expectedPreviewFingerprints: [PREVIEW_DIRECT_FINGERPRINT, PREVIEW_POOLED_FINGERPRINT],
    })
    if (recheck.runtime.fingerprint !== proof.runtime.fingerprint) {
      throw new Error(
        `DATA-02: fingerprint mudou entre prova e escrita (${proof.runtime.fingerprint} → ${recheck.runtime.fingerprint}). Abortado.`,
      )
    }
  }

  const result = await reprocessLegacyPrayer({
    prayerId,
    apply,
    ownerAuthorization: confirm,
    requirePreviewProof: requirePreview,
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
