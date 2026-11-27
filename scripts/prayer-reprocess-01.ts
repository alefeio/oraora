/**
 * PRAYER-REPROCESS-01 — reprocessamento ÚNICO autorizado no Preview.
 *
 * Dry-run (padrão):
 *   npx tsx scripts/prayer-reprocess-01.ts
 *
 * Apply:
 *   npx tsx scripts/prayer-reprocess-01.ts --apply --confirm=OWNER_AUTHORIZED
 *
 * Não usa a autorização genérica de Preview do script legado.
 * Sem corpo de oração / e-mails / tokens no log.
 */
import { createHash } from "node:crypto"
import { config as loadEnv } from "dotenv"

function envFileArg(): string {
  const prefix = "--env-file="
  const hit = process.argv.find((a) => a.startsWith(prefix))
  if (hit) return hit.slice(prefix.length)
  // Arquivo gerado por `vercel env pull --environment preview` (não versionado).
  return ".env.preview.reprocess.tmp"
}

const previewEnvFile = envFileArg()
loadEnv({ path: previewEnvFile, quiet: true, override: true })
loadEnv({ path: ".env.local", quiet: true })
loadEnv({ path: ".env", quiet: true })

function remapPreviewEnv() {
  const direct =
    process.env.DATABASE_URL_UNPOOLED?.trim() ||
    process.env.PRISMA_DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.DATABASE_URL?.trim()
  const pooled = process.env.DATABASE_URL_POOLED?.trim() || direct
  if (!direct || !pooled || direct.includes("[SENSITIVE]") || pooled.includes("[SENSITIVE]")) {
    throw new Error(
      `URLs Preview inválidas. Gere com: vercel env pull ${previewEnvFile} --environment preview`,
    )
  }
  process.env.DIRECT_URL = direct
  process.env.DATABASE_URL = direct
  process.env.RUNTIME_DATABASE_URL = pooled
  process.env.ALLOW_REMOTE_DB_WRITE = "true"
  delete process.env.VERCEL_ENV
}

remapPreviewEnv()
console.info("preview_env_file", previewEnvFile)

const GATE = "PRAYER-REPROCESS-01"
const OWNER_TOKEN = "OWNER_AUTHORIZED"

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`)
}

function arg(name: string): string | undefined {
  const prefix = `--${name}=`
  const hit = process.argv.find((a) => a.startsWith(prefix))
  if (hit) return hit.slice(prefix.length)
  const idx = process.argv.indexOf(`--${name}`)
  if (idx >= 0) return process.argv[idx + 1]
  return undefined
}

function maskId(id: string) {
  if (id.length <= 8) return "***"
  return `${id.slice(0, 4)}…${id.slice(-4)}`
}

function effectsAlreadyApplied(effects: unknown): boolean {
  if (!effects || typeof effects !== "object") return false
  const e = effects as { reciprocity?: boolean | null; feedCount?: boolean | null }
  return (
    e.reciprocity === true ||
    e.reciprocity === false ||
    e.feedCount === true ||
    e.feedCount === false
  )
}

async function main() {
  const apply = hasFlag("apply")
  const confirm = arg("confirm")

  if (process.env.VERCEL_ENV === "production") {
    throw new Error("Recusado: VERCEL_ENV=production.")
  }

  const { assertDatabaseWriteAllowed, redactDatabaseTarget } = await import("../src/lib/db/guards")
  const { resolveDirectDatabaseUrl, resolveRuntimeDatabaseUrl } = await import(
    "../src/lib/db/connection"
  )
  const {
    PREVIEW_DIRECT_FINGERPRINT,
    PREVIEW_POOLED_FINGERPRINT,
    PREVIEW_STORE_ID,
    fingerprintDatabaseUrl,
    proveEffectivePrismaWriteTarget,
  } = await import("../src/lib/db/write-target")
  const { prisma } = await import("../src/lib/db/prisma")
  const { reprocessLegacyPrayer } = await import(
    "../src/modules/intercession/reprocess-legacy-prayer"
  )
  const { applyValidationDecision } = await import("../src/modules/intercession/apply-validation")
  const {
    classifyPrayerSubmission,
    ABUSE_RATE_LIMITS,
    VALIDATION_POLICY_VERSION,
  } = await import("../src/modules/intercession/validation-policy-v2")
  const { lockIntercessorUser, lockPrayerRequest } = await import(
    "../src/modules/reciprocity/eligibility"
  )

  try {
    const direct = resolveDirectDatabaseUrl()
    const runtime = resolveRuntimeDatabaseUrl()
    const directFp = fingerprintDatabaseUrl(direct.url)
    const runtimeFp = fingerprintDatabaseUrl(runtime.url)

    console.info(GATE)
    console.info("mode", apply ? "APPLY" : "DRY_RUN")
    console.info("preview_store_expected", PREVIEW_STORE_ID)
    console.info("fingerprints_expected", {
      direct: PREVIEW_DIRECT_FINGERPRINT,
      pooled: PREVIEW_POOLED_FINGERPRINT,
    })
    console.info("fingerprints_observed", {
      direct: directFp.fingerprint,
      runtime: runtimeFp.fingerprint,
      directLocal: directFp.local,
      runtimeLocal: runtimeFp.local,
    })

    if (directFp.local || runtimeFp.local) {
      throw new Error("Alvo local detectado — PRAYER-REPROCESS-01 exige Preview remoto.")
    }
    const authorizedFp = new Set([PREVIEW_DIRECT_FINGERPRINT, PREVIEW_POOLED_FINGERPRINT])
    if (!authorizedFp.has(directFp.fingerprint) || !authorizedFp.has(runtimeFp.fingerprint)) {
      throw new Error(
        `Fingerprint não autorizado (direct=${directFp.fingerprint}, runtime=${runtimeFp.fingerprint}).`,
      )
    }

    const guard = assertDatabaseWriteAllowed()
    console.info("db_guard", redactDatabaseTarget(guard))

    const proof = await proveEffectivePrismaWriteTarget(prisma, {
      requirePreview: true,
      expectedPreviewFingerprints: [PREVIEW_DIRECT_FINGERPRINT, PREVIEW_POOLED_FINGERPRINT],
    })
    console.info("effective_db_target", {
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
    if (!proof.authorizedPreview || proof.authorizedLocal) {
      throw new Error("Destino efetivo não é Preview autorizado exclusivo.")
    }

    const inaugural = await prisma.prayerRequest.findFirst({
      where: {
        isSyntheticFixture: false,
        status: { in: ["open", "paused"] },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        authorId: true,
        validPrayerCount: true,
        isSyntheticFixture: true,
        status: true,
      },
    })
    if (!inaugural) throw new Error("Pedido inaugural real não encontrado.")
    if (inaugural.isSyntheticFixture) throw new Error("Pedido candidato é sintético — abortado.")

    const pendingCandidates = await prisma.prayer.findMany({
      where: {
        requestId: inaugural.id,
        status: "submitted",
        validation: { outcome: "pending" },
      },
      include: {
        validation: true,
        intercessor: { select: { id: true, banned: true } },
      },
      orderBy: { createdAt: "asc" },
    })

    if (pendingCandidates.length !== 1) {
      throw new Error(
        `Esperado exatamente 1 oração pending no inaugural; encontrado ${pendingCandidates.length}.`,
      )
    }

    const prayer = pendingCandidates[0]!
    if (prayer.intercessorId === inaugural.authorId) {
      throw new Error("Intercessor igual ao beneficiário — abortado.")
    }
    if (!prayer.intercessor || prayer.intercessor.banned) {
      throw new Error("Intercessor inativo/suspenso — abortado.")
    }
    if (prayer.beneficiaryId !== inaugural.authorId) {
      throw new Error("Beneficiário não corresponde ao autor do inaugural — abortado.")
    }
    if (!prayer.validation || prayer.validation.outcome !== "pending") {
      throw new Error("Validação não está pending — abortado.")
    }
    if (prayer.validation.decidedByUserId) {
      throw new Error("Decisão humana prévia — abortado.")
    }
    if (effectsAlreadyApplied(prayer.validation.effects)) {
      throw new Error("Efeitos de validação já aplicados — abortado.")
    }

    const body = prayer.body.replace(/\r\n/g, "\n").trim()
    const contentHash = createHash("sha256")
      .update(body.normalize("NFKC").toLowerCase())
      .digest("hex")
    if (contentHash !== prayer.contentHash) {
      throw new Error("Integridade contentHash falhou — abortado.")
    }

    const priorEligibility = await prisma.requestEligibility.findUnique({
      where: { sourcePrayerId: prayer.id },
    })
    if (priorEligibility) {
      throw new Error("Elegibilidade já vinculada a esta oração — abortado.")
    }

    const openEligibilityBefore = await prisma.requestEligibility.count({
      where: { userId: prayer.intercessorId, status: "open" },
    })

    const windowStart = new Date(Date.now() - ABUSE_RATE_LIMITS.windowMs)
    const [submissionsInWindow, duplicateHashCount] = await Promise.all([
      prisma.prayer.count({
        where: {
          intercessorId: prayer.intercessorId,
          createdAt: { gte: windowStart },
          id: { not: prayer.id },
        },
      }),
      prisma.prayer.count({
        where: {
          intercessorId: prayer.intercessorId,
          contentHash: prayer.contentHash,
          createdAt: { gte: windowStart },
          id: { not: prayer.id },
        },
      }),
    ])

    const classification = classifyPrayerSubmission({
      body,
      submissionsInWindow,
      duplicateHashCount,
    })

    const prayerCountBefore = await prisma.prayer.count()
    const auditBefore = await prisma.auditEvent.count({
      where: { action: "prayer.validation_decided", subjectId: prayer.id },
    })

    console.info("preflight", {
      prayerIdMasked: maskId(prayer.id),
      requestIdMasked: maskId(inaugural.id),
      intercessorIdMasked: maskId(prayer.intercessorId),
      beneficiaryIdMasked: maskId(prayer.beneficiaryId),
      status: prayer.status,
      validationOutcome: prayer.validation.outcome,
      policyVersion: prayer.validation.policyVersion,
      decidedByUserIdNull: prayer.validation.decidedByUserId == null,
      contentHashOk: true,
      intercessorActive: true,
      beneficiaryMatches: true,
      syntheticRequest: false,
      priorEligibility: false,
      validPrayerCount: inaugural.validPrayerCount,
      openEligibilityIntercessor: openEligibilityBefore,
    })

    console.info("dry_run_classification", {
      kind: classification.kind,
      outcome: classification.kind === "decide" ? classification.outcome : null,
      code: classification.kind === "block_before_submit" ? classification.code : null,
      signals: classification.signals,
      effects: classification.kind === "decide" ? classification.effects : null,
      policyVersionTarget: VALIDATION_POLICY_VERSION,
    })

    const moduleDry = await reprocessLegacyPrayer({ prayerId: prayer.id, apply: false })
    console.info("module_dry_run", {
      prayerIdMasked: maskId(moduleDry.prayerId),
      currentOutcome: moduleDry.currentOutcome,
      eligible: moduleDry.integrity.eligibleForReprocess,
      skipReason: moduleDry.integrity.skipReason,
      classificationOutcome:
        moduleDry.classification.outcome ?? moduleDry.classification.code ?? null,
    })

    if (classification.kind !== "decide" || classification.outcome !== "accepted") {
      console.error("ABORT: classificação não é accepted — apply não autorizado.")
      console.info("LEGACY PRAYER APPLY: NOT EXECUTED")
      process.exitCode = 2
      return
    }
    if (!moduleDry.integrity.eligibleForReprocess) {
      console.error("ABORT: módulo marca não elegível:", moduleDry.integrity.skipReason)
      console.info("LEGACY PRAYER APPLY: NOT EXECUTED")
      process.exitCode = 2
      return
    }

    if (!apply) {
      console.info("dry_run_ok: condições autorizadas comprovadas; classificação=accepted.")
      console.info("LEGACY PRAYER APPLY: NOT EXECUTED")
      return
    }

    if (confirm !== OWNER_TOKEN) {
      throw new Error("Apply exige --confirm=OWNER_AUTHORIZED.")
    }

    const recheck = await proveEffectivePrismaWriteTarget(prisma, {
      requirePreview: true,
      expectedPreviewFingerprints: [PREVIEW_DIRECT_FINGERPRINT, PREVIEW_POOLED_FINGERPRINT],
    })
    if (recheck.runtime.fingerprint !== proof.runtime.fingerprint) {
      throw new Error("Fingerprint mudou entre prova e escrita — abortado.")
    }

    const authorizedPrayerId = prayer.id

    const applied = await prisma.$transaction(async (tx) => {
      await lockIntercessorUser(tx, prayer.intercessorId)
      await lockPrayerRequest(tx, prayer.requestId)

      const fresh = await tx.prayer.findUniqueOrThrow({
        where: { id: authorizedPrayerId },
        include: {
          validation: true,
          request: { select: { authorId: true, isSyntheticFixture: true } },
        },
      })
      if (fresh.id !== authorizedPrayerId) throw new Error("ID divergente.")
      if (fresh.status !== "submitted") throw new Error("Status não submitted.")
      if (fresh.validation?.outcome !== "pending") throw new Error("Outcome não pending.")
      if (fresh.validation.decidedByUserId) throw new Error("Decisão humana detectada.")
      if (effectsAlreadyApplied(fresh.validation.effects)) {
        throw new Error("Efeitos já aplicados.")
      }
      if (fresh.request.isSyntheticFixture) throw new Error("Pedido sintético.")
      if (fresh.beneficiaryId !== fresh.request.authorId) {
        throw new Error("Beneficiário divergente.")
      }
      if (fresh.intercessorId === fresh.beneficiaryId) throw new Error("Auto-oração.")

      const bodyFresh = fresh.body.replace(/\r\n/g, "\n").trim()
      const hashFresh = createHash("sha256")
        .update(bodyFresh.normalize("NFKC").toLowerCase())
        .digest("hex")
      if (hashFresh !== fresh.contentHash) throw new Error("Hash divergente na TX.")

      const linked = await tx.requestEligibility.findUnique({
        where: { sourcePrayerId: fresh.id },
      })
      if (linked) throw new Error("Elegibilidade já existia na TX.")

      return applyValidationDecision(tx, {
        prayerId: fresh.id,
        requestId: fresh.requestId,
        intercessorId: fresh.intercessorId,
        prayerCreatedAt: fresh.createdAt,
        outcome: "accepted",
        effects: classification.effects,
        rationale: classification.rationale,
        signals: {
          ...(typeof fresh.validation.signals === "object" && fresh.validation.signals
            ? (fresh.validation.signals as object)
            : {}),
          classificationSignals: classification.signals,
          decisionSource: "system_reprocess",
          gate: GATE,
          reprocessPolicyVersion: VALIDATION_POLICY_VERSION,
        },
        decidedByUserId: null,
        decisionSource: "system_reprocess",
        fromOutcomes: ["pending"],
        policyVersion: VALIDATION_POLICY_VERSION,
      })
    })

    const after = await prisma.prayer.findUniqueOrThrow({
      where: { id: prayer.id },
      include: { validation: true },
    })
    const requestAfter = await prisma.prayerRequest.findUniqueOrThrow({
      where: { id: inaugural.id },
      select: { validPrayerCount: true },
    })
    const eligibilityAfter = await prisma.requestEligibility.findUnique({
      where: { sourcePrayerId: prayer.id },
    })
    const openEligibilityAfter = await prisma.requestEligibility.count({
      where: { userId: prayer.intercessorId, status: "open" },
    })
    const prayerCountAfter = await prisma.prayer.count()
    const auditAfter = await prisma.auditEvent.count({
      where: { action: "prayer.validation_decided", subjectId: prayer.id },
    })

    const idempotent = await reprocessLegacyPrayer({
      prayerId: prayer.id,
      apply: false,
    })

    console.info("apply_result", {
      reused: applied.reused,
      eligibility: applied.eligibilityResult,
      validationAfter: after.validation?.outcome,
      policyVersionAfter: after.validation?.policyVersion,
      decidedByUserIdNull: after.validation?.decidedByUserId == null,
      signalsDecisionSource: (after.validation?.signals as { decisionSource?: string } | null)
        ?.decisionSource,
      validPrayerCountBefore: inaugural.validPrayerCount,
      validPrayerCountAfter: requestAfter.validPrayerCount,
      eligibilityAfterStatus: eligibilityAfter?.status ?? null,
      openEligibilityAfter,
      auditBefore,
      auditAfter,
      prayerCountBefore,
      prayerCountAfter,
      samePrayerId: after.id === prayer.id,
      contentHashUnchanged: after.contentHash === prayer.contentHash,
      idempotentMessage: idempotent.message,
      idempotentOutcome: idempotent.currentOutcome,
    })

    console.info("LEGACY PRAYER APPLY: EXECUTED")
    console.info("PRODUCTION WRITES: 0")
    console.info("GATE", GATE, "PASS")
  } finally {
    const { prisma } = await import("../src/lib/db/prisma")
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  console.info("LEGACY PRAYER APPLY: NOT EXECUTED")
  process.exitCode = 1
})
