import type { Prisma } from "@/generated/prisma/client"
import { recordAuditEvent } from "@/lib/security/audit"
import {
  lockPrayerRequest,
  maybeOpenEligibilityFromAcceptedPrayer,
  rebuildValidPrayerCount,
} from "@/modules/reciprocity/eligibility"
import { DomainError } from "./errors"
import { VALIDATION_POLICY_VERSION } from "./validation-policy-v2"

type Tx = Prisma.TransactionClient

export type ApplyValidationDecisionInput = {
  prayerId: string
  requestId: string
  intercessorId: string
  prayerCreatedAt: Date
  outcome: "accepted" | "rejected" | "manual_review"
  effects: {
    reciprocity: boolean | null
    feedCount: boolean | null
    solidarity: null
  }
  rationale?: string | null
  signals?: Record<string, unknown> | null
  /** null = decisão do sistema (auto). */
  decidedByUserId: string | null
  decisionSource: "system_auto" | "admin" | "system_reprocess"
  /** Outcomes a partir dos quais a transição é permitida. */
  fromOutcomes: string[]
  policyVersion?: number
}

/**
 * Aplica decisão de validação + efeitos de reciprocidade na mesma transação.
 * Usado por auto-validação, admin e reprocessamento — sem simular ADMIN.
 */
export async function applyValidationDecision(tx: Tx, input: ApplyValidationDecisionInput) {
  await lockPrayerRequest(tx, input.requestId)

  // manual_review: decidedAt permanece nulo até decisão humana.
  const effectiveDecidedAt =
    input.outcome === "accepted" || input.outcome === "rejected" ? new Date() : null

  const won = await tx.prayerValidation.updateMany({
    where: {
      prayerId: input.prayerId,
      outcome: { in: input.fromOutcomes },
    },
    data: {
      outcome: input.outcome,
      effects: input.effects,
      rationale: input.rationale?.trim() || null,
      signals:
        input.signals === undefined
          ? undefined
          : (input.signals as Prisma.InputJsonValue),
      decidedAt: effectiveDecidedAt,
      decidedByUserId: input.decidedByUserId,
      policyVersion: input.policyVersion ?? VALIDATION_POLICY_VERSION,
    },
  })

  if (won.count !== 1) {
    const current = await tx.prayerValidation.findUniqueOrThrow({
      where: { prayerId: input.prayerId },
    })
    if (current.outcome === input.outcome) {
      return {
        reused: true as const,
        eligibilityResult: { opened: false, reason: "unchanged" as const },
      }
    }
    throw new DomainError(
      "Esta oração já possui uma decisão diferente. Registre uma revisão auditada explícita.",
      "VALIDATION_CONFLICT",
      409,
    )
  }

  let eligibilityResult: { opened: boolean; reason: string; eligibilityId?: string } = {
    opened: false,
    reason: "not_applicable",
  }

  if (input.outcome === "accepted") {
    eligibilityResult = await maybeOpenEligibilityFromAcceptedPrayer(tx, {
      userId: input.intercessorId,
      prayerId: input.prayerId,
      prayerCreatedAt: input.prayerCreatedAt,
    })
  }

  await rebuildValidPrayerCount(tx, input.requestId)

  const actorType =
    input.decisionSource === "admin" ? ("admin" as const) : ("system" as const)

  await recordAuditEvent(
    {
      actorType,
      actorUserId: input.decidedByUserId,
      action: "prayer.validation_decided",
      subjectType: "prayer",
      subjectId: input.prayerId,
      metadata: {
        outcome: input.outcome,
        decisionSource: input.decisionSource,
        policyVersion: input.policyVersion ?? VALIDATION_POLICY_VERSION,
        eligibility: eligibilityResult,
        // Sem corpo da oração.
      },
    },
    tx,
  )

  return { reused: false as const, eligibilityResult }
}
