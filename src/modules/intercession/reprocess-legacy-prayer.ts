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
  /** Deve ser OWNER_AUTHORIZED para apply. */
  ownerAuthorization?: string
  /** Quando true, exige proveEffectivePrismaWriteTarget Preview (feito no script). */
  requirePreviewProof?: boolean
}

export type ReprocessLegacyPrayerResult = {
  prayerId: string
  intercessorId: string
  beneficiaryId: string
  requestId: string
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
    statusSubmitted: boolean
    intercessorActive: boolean
    beneficiaryMatchesRequest: boolean
    noPriorEffectsApplied: boolean
    noHumanDecision: boolean
    eligibleForReprocess: boolean
    skipReason: string | null
  }
  dryRun: boolean
  applied: boolean
  eligibility?: { opened: boolean; reason: string }
  message: string
}

function effectsAlreadyApplied(effects: unknown): boolean {
  if (!effects || typeof effects !== "object") return false
  const e = effects as { reciprocity?: boolean | null; feedCount?: boolean | null }
  return e.reciprocity === true || e.reciprocity === false || e.feedCount === true || e.feedCount === false
}

/**
 * Reprocessamento controlado de UM registro legado.
 * - Não libera automaticamente `manual_review` da política V2.
 * - Não sobrescreve decisão humana (`decidedByUserId`).
 * - Não reaplica se efeitos já foram gravados.
 * Dry-run por padrão. Sem massa. Sem simular ADMIN.
 */
export async function reprocessLegacyPrayer(
  input: ReprocessLegacyPrayerInput,
): Promise<ReprocessLegacyPrayerResult> {
  const prayer = await prisma.prayer.findUnique({
    where: { id: input.prayerId },
    include: {
      validation: true,
      request: { select: { id: true, authorId: true, title: true, isSyntheticFixture: true } },
      intercessor: { select: { id: true, banned: true } },
    },
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
  const statusSubmitted = prayer.status === "submitted"
  const intercessorActive = Boolean(prayer.intercessor && !prayer.intercessor.banned)
  const beneficiaryMatchesRequest = prayer.beneficiaryId === prayer.request.authorId
  const noPriorEffectsApplied = !effectsAlreadyApplied(prayer.validation.effects)
  const noHumanDecision = prayer.validation.decidedByUserId == null

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

  let skipReason: string | null = null
  const outcome = prayer.validation.outcome
  const policyVersion = prayer.validation.policyVersion

  // manual_review da V2: fila humana — script de legado não libera automaticamente.
  if (outcome === "manual_review" && policyVersion >= VALIDATION_POLICY_VERSION) {
    skipReason = "v2_manual_review_requires_human"
  } else if (!["pending", "manual_review"].includes(outcome)) {
    skipReason = "outcome_not_reprocessable"
  } else if (!noHumanDecision) {
    skipReason = "human_decision_preserved"
  } else if (!noPriorEffectsApplied) {
    skipReason = "effects_already_applied"
  } else if (!statusSubmitted) {
    skipReason = "status_not_submitted"
  } else if (!intercessorActive) {
    skipReason = "intercessor_inactive"
  } else if (!beneficiaryMatchesRequest) {
    skipReason = "beneficiary_mismatch"
  } else if (!contentHashMatches) {
    skipReason = "content_hash_mismatch"
  } else if (body.length < 1) {
    skipReason = "empty_body"
  }

  const eligibleForReprocess = skipReason === null

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
    beneficiaryId: prayer.beneficiaryId,
    requestId: prayer.requestId,
    currentOutcome: outcome,
    policyVersionCurrent: policyVersion,
    classification: classificationView,
    integrity: {
      hasValidation: true,
      bodyNonEmpty: body.length > 0,
      contentHashMatches,
      statusSubmitted,
      intercessorActive,
      beneficiaryMatchesRequest,
      noPriorEffectsApplied,
      noHumanDecision,
      eligibleForReprocess,
      skipReason,
    },
    dryRun: true,
    applied: false,
    message: skipReason
      ? `Dry-run: não elegível (${skipReason}). Nenhuma escrita.`
      : "Dry-run concluído. Nenhuma escrita realizada.",
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
      `Reprocessamento recusado: ${skipReason}.`,
      "REPROCESS_NOT_ELIGIBLE",
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

  // Nunca promover automatic_review V2 via este caminho (já coberto por skipReason).
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
