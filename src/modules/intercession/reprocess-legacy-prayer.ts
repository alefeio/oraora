import { createHash } from "node:crypto"
import { prisma } from "@/lib/db/prisma"
import { applyValidationDecision } from "./apply-validation"
import { DomainError, PrayerNotFoundError } from "./errors"
import {
  ABUSE_RATE_LIMITS,
  classifyPrayerSubmission,
  VALIDATION_POLICY_VERSION,
} from "./validation-policy-v2"

export type ReprocessLegacyPrayerInput = {
  prayerId: string
  /** Dry-run por padrão — nunca aplica sem apply=true + autorização. */
  apply?: boolean
  /** Deve ser OWNER_AUTHORIZED para apply em Preview. */
  ownerAuthorization?: string
}

export type ReprocessLegacyPrayerResult = {
  prayerId: string
  intercessorId: string
  currentOutcome: string
  policyVersionCurrent: number
  classification: {
    kind: string
    outcome?: string
    code?: string
    signals: string[]
    rationale: string | null
  }
  integrity: {
    hasValidation: boolean
    bodyNonEmpty: boolean
    contentHashMatches: boolean
    eligibleForReprocess: boolean
  }
  dryRun: boolean
  applied: boolean
  eligibility?: { opened: boolean; reason: string }
  message: string
}

/**
 * Reprocessamento controlado de um único registro legado (pending / manual_review).
 * Sem massa. Sem simular ADMIN. Dry-run por padrão.
 */
export async function reprocessLegacyPrayer(
  input: ReprocessLegacyPrayerInput,
): Promise<ReprocessLegacyPrayerResult> {
  const prayer = await prisma.prayer.findUnique({
    where: { id: input.prayerId },
    include: { validation: true },
  })
  if (!prayer) throw new PrayerNotFoundError()
  if (!prayer.validation) {
    throw new DomainError("Oração sem registro de validação.", "VALIDATION_MISSING", 404)
  }

  const body = prayer.body.replace(/\r\n/g, "\n").trim()
  const contentHash = createHash("sha256")
    .update(body.normalize("NFKC").toLowerCase())
    .digest("hex")
  const contentHashMatches = prayer.contentHash === contentHash

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

  const eligibleOutcomes = new Set(["pending", "manual_review"])
  const eligibleForReprocess = eligibleOutcomes.has(prayer.validation.outcome)

  const classificationView =
    classification.kind === "block_before_submit"
      ? {
          kind: classification.kind,
          code: classification.code,
          signals: classification.signals,
          rationale: classification.message,
        }
      : {
          kind: classification.kind,
          outcome: classification.outcome,
          signals: classification.signals,
          rationale: classification.rationale,
        }

  const base: ReprocessLegacyPrayerResult = {
    prayerId: prayer.id,
    intercessorId: prayer.intercessorId,
    currentOutcome: prayer.validation.outcome,
    policyVersionCurrent: prayer.validation.policyVersion,
    classification: classificationView,
    integrity: {
      hasValidation: true,
      bodyNonEmpty: body.length > 0,
      contentHashMatches,
      eligibleForReprocess,
    },
    dryRun: true,
    applied: false,
    message: "Dry-run concluído. Nenhuma escrita realizada.",
  }

  if (
    classification.kind === "decide" &&
    prayer.validation.outcome === classification.outcome
  ) {
    return {
      ...base,
      dryRun: !input.apply,
      applied: false,
      message: "Decisão já alinhada à política V2 (idempotente).",
    }
  }

  if (!input.apply) {
    return base
  }

  if (input.ownerAuthorization !== "OWNER_AUTHORIZED") {
    throw new DomainError(
      "Reprocessamento com apply exige --confirm=OWNER_AUTHORIZED.",
      "OWNER_AUTHORIZATION_REQUIRED",
      403,
    )
  }

  if (!eligibleForReprocess) {
    throw new DomainError(
      "Esta oração não está em pending/manual_review — reprocessamento recusado.",
      "REPROCESS_NOT_ELIGIBLE",
      409,
    )
  }

  if (!contentHashMatches) {
    throw new DomainError(
      "Integridade do contentHash falhou — reprocessamento recusado.",
      "CONTENT_HASH_MISMATCH",
      409,
    )
  }

  if (classification.kind === "block_before_submit") {
    throw new DomainError(
      "Classificação V2 pediria correção pré-envio; para legado use decisão administrativa.",
      "REPROCESS_NEEDS_ADMIN",
      422,
    )
  }

  const applied = await prisma.$transaction(async (tx) => {
    return applyValidationDecision(tx, {
      prayerId: prayer.id,
      requestId: prayer.requestId,
      intercessorId: prayer.intercessorId,
      prayerCreatedAt: prayer.createdAt,
      outcome: classification.outcome,
      effects: classification.effects,
      rationale: classification.rationale,
      signals: {
        ...(typeof prayer.validation!.signals === "object" && prayer.validation!.signals
          ? (prayer.validation!.signals as object)
          : {}),
        classificationSignals: classification.signals,
        decisionSource: "system_reprocess",
        reprocessPolicyVersion: VALIDATION_POLICY_VERSION,
      },
      decidedByUserId: null,
      decisionSource: "system_reprocess",
      fromOutcomes: ["pending", "manual_review"],
      policyVersion: VALIDATION_POLICY_VERSION,
    })
  })

  return {
    ...base,
    dryRun: false,
    applied: !applied.reused,
    eligibility: applied.eligibilityResult,
    message: applied.reused
      ? "Decisão já aplicada (idempotente)."
      : `Decisão ${classification.outcome} aplicada pela política v${VALIDATION_POLICY_VERSION}.`,
  }
}
