/**
 * UI-05D.1 / DATA-02 — insere apenas passagens/tópicos/vínculos ausentes do catálogo oficial.
 * Não atualiza existentes. Não chama seed de categorias.
 *
 * Uso:
 *   npx tsx scripts/insert-missing-scripture.ts          # dry-run (padrão)
 *   npx tsx scripts/insert-missing-scripture.ts --apply  # escrita (exige guardas + fingerprint Prisma)
 *
 * Preview compartilhado: NÃO executar --apply sem autorização explícita do proprietário.
 * Preflight Preview RO: scripts/preflight-scripture-preview.ts
 */
import { config as loadEnv } from "dotenv"
import { assertDatabaseWriteAllowed, redactDatabaseTarget } from "../src/lib/db/guards"
import { prisma } from "../src/lib/db/prisma"
import {
  PREVIEW_DIRECT_FINGERPRINT,
  PREVIEW_POOLED_FINGERPRINT,
  proveEffectivePrismaWriteTarget,
} from "../src/lib/db/write-target"
import { OFFICIAL_SCRIPTURE_EXPECTED } from "../src/modules/scripture/expected-counts"
import { SCRIPTURE_PASSAGES, SCRIPTURE_TOPICS } from "../src/modules/scripture/catalog"
import { insertMissingScriptureOnly } from "../src/modules/scripture/insert-missing"

loadEnv({ path: ".env.local", quiet: true })
loadEnv({ path: ".env", quiet: true })

async function main() {
  const apply = process.argv.includes("--apply")
  const requirePreview = process.argv.includes("--preview")
  const target = assertDatabaseWriteAllowed()
  console.info("guard_target", redactDatabaseTarget(target))
  console.info("mode", apply ? "apply" : "dry-run")
  console.info("catalog", {
    passages: SCRIPTURE_PASSAGES.length,
    topics: SCRIPTURE_TOPICS.length,
  })
  console.info("expected_after_apply", OFFICIAL_SCRIPTURE_EXPECTED)

  // DATA-02: prova o destino efetivo do Prisma (URL de runtime + current_database live).
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

  const [passages, topics, categoryLinks, passageLinks] = await Promise.all([
    prisma.scripturePassage.count(),
    prisma.scriptureTopic.count(),
    prisma.categoryScriptureTopic.count(),
    prisma.scripturePassageTopic.count(),
  ])
  console.info("current_counts", { passages, topics, categoryLinks, passageLinks })

  if (!apply) {
    console.info("dry-run: nenhuma escrita. Passe --apply para inserir ausentes.")
    return
  }

  // Revalida imediatamente antes da transação (mesmo cliente Prisma).
  const recheck = await proveEffectivePrismaWriteTarget(prisma, {
    requirePreview,
    expectedPreviewFingerprints: [PREVIEW_DIRECT_FINGERPRINT, PREVIEW_POOLED_FINGERPRINT],
  })
  if (recheck.runtime.fingerprint !== proof.runtime.fingerprint) {
    throw new Error(
      `DATA-02: fingerprint mudou entre prova e escrita (${proof.runtime.fingerprint} → ${recheck.runtime.fingerprint}). Abortado.`,
    )
  }

  const result = await insertMissingScriptureOnly(prisma)
  console.info("insert_missing_result", result)

  const [p2, t2, c2, l2] = await Promise.all([
    prisma.scripturePassage.count(),
    prisma.scriptureTopic.count(),
    prisma.categoryScriptureTopic.count(),
    prisma.scripturePassageTopic.count(),
  ])
  console.info("counts_after_apply", {
    passages: p2,
    topics: t2,
    categoryLinks: c2,
    passageLinks: l2,
  })
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
