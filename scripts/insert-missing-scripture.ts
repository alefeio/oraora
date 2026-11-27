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

const requirePreview = process.argv.includes("--preview")
const apply = process.argv.includes("--apply")
const envFileArg = process.argv.find((a) => a.startsWith("--env-file="))?.slice("--env-file=".length)

if (requirePreview) {
  const previewFile = envFileArg || ".env.preview.reprocess.tmp"
  loadEnv({ path: previewFile, quiet: true, override: true })
  const direct =
    process.env.DATABASE_URL_UNPOOLED?.trim() ||
    process.env.PRISMA_DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.DATABASE_URL?.trim()
  const pooled = process.env.DATABASE_URL_POOLED?.trim() || direct
  if (!direct || !pooled || direct.includes("[SENSITIVE]") || pooled.includes("[SENSITIVE]")) {
    throw new Error(
      `Preview URLs inválidas. Use: vercel env pull ${previewFile} --environment preview`,
    )
  }
  process.env.DIRECT_URL = direct
  process.env.DATABASE_URL = direct
  process.env.RUNTIME_DATABASE_URL = pooled
  process.env.ALLOW_REMOTE_DB_WRITE = "true"
  delete process.env.VERCEL_ENV
  console.info("preview_env_file", previewFile)
} else {
  loadEnv({ path: ".env.local", quiet: true })
  loadEnv({ path: ".env", quiet: true })
}

async function main() {
  const { assertDatabaseWriteAllowed, redactDatabaseTarget } = await import("../src/lib/db/guards")
  const { prisma } = await import("../src/lib/db/prisma")
  const {
    PREVIEW_DIRECT_FINGERPRINT,
    PREVIEW_POOLED_FINGERPRINT,
    proveEffectivePrismaWriteTarget,
  } = await import("../src/lib/db/write-target")
  const { OFFICIAL_SCRIPTURE_EXPECTED } = await import("../src/modules/scripture/expected-counts")
  const { SCRIPTURE_PASSAGES, SCRIPTURE_TOPICS } = await import("../src/modules/scripture/catalog")
  const { insertMissingScriptureOnly } = await import("../src/modules/scripture/insert-missing")

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

  // Inventário pós-apply por referência (sem textos).
  const refs = await prisma.scripturePassage.findMany({
    select: { referenceLabel: true, licenseStatus: true, textBody: true, active: true },
    orderBy: { referenceLabel: "asc" },
  })
  console.info("passages_inventory", {
    count: refs.length,
    allReferenceOnly: refs.every((r) => r.licenseStatus === "reference_only"),
    allTextNull: refs.every((r) => r.textBody == null),
    allActive: refs.every((r) => r.active),
    labels: refs.map((r) => r.referenceLabel),
  })

  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
  try {
    const { prisma } = await import("../src/lib/db/prisma")
    await prisma.$disconnect()
  } catch {
    /* ignore */
  }
})
