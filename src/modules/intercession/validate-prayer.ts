import { prisma } from "@/lib/db/prisma"
import { isAdminRole } from "@/lib/auth/policy"
import { applyValidationDecision } from "./apply-validation"
import { DomainError, PrayerNotAllowedError, PrayerNotFoundError } from "./errors"
import { toPrayerDto } from "./dto"
import { VALIDATION_POLICY_VERSION } from "./validation-policy-v2"

export type DecidePrayerValidationInput = {
  prayerId: string
  actorUserId: string
  outcome: "accepted" | "rejected"
  rationale?: string | null
}

/**
 * Decisão administrativa sobre oração em fila de exceção (manual_review / pending legado).
 * Reutiliza o mesmo motor transacional da auto-validação.
 */
export async function decidePrayerValidation(input: DecidePrayerValidationInput) {
  const actor = await prisma.user.findUnique({ where: { id: input.actorUserId } })
  if (!actor || actor.banned || !isAdminRole(actor.role)) {
    throw new PrayerNotAllowedError(
      "Apenas administradores podem validar orações.",
      "ADMIN_REQUIRED",
    )
  }

  const prayer = await prisma.prayer.findUnique({
    where: { id: input.prayerId },
    include: { validation: true, scripturePassage: true },
  })
  if (!prayer || !prayer.validation) throw new PrayerNotFoundError()

  if (prayer.intercessorId === input.actorUserId) {
    throw new PrayerNotAllowedError(
      "Você não pode aprovar a própria oração.",
      "SELF_VALIDATION_FORBIDDEN",
    )
  }

  if (prayer.validation.outcome === input.outcome && prayer.validation.decidedAt) {
    return {
      prayer: toPrayerDto(prayer),
      eligibility: { opened: false, reason: "unchanged" },
      reused: true as const,
    }
  }

  if (
    prayer.validation.outcome !== "pending" &&
    prayer.validation.outcome !== "manual_review" &&
    prayer.validation.outcome !== input.outcome
  ) {
    throw new DomainError(
      "Esta oração já possui uma decisão diferente. Registre uma revisão auditada explícita.",
      "VALIDATION_CONFLICT",
      409,
    )
  }

  const effects =
    input.outcome === "accepted"
      ? { reciprocity: true, feedCount: true, solidarity: null }
      : { reciprocity: false, feedCount: false, solidarity: null }

  const result = await prisma.$transaction(async (tx) => {
    const applied = await applyValidationDecision(tx, {
      prayerId: prayer.id,
      requestId: prayer.requestId,
      intercessorId: prayer.intercessorId,
      prayerCreatedAt: prayer.createdAt,
      outcome: input.outcome,
      effects,
      rationale: input.rationale,
      signals: {
        ...(typeof prayer.validation!.signals === "object" && prayer.validation!.signals
          ? (prayer.validation!.signals as object)
          : {}),
        adminDecision: true,
        decisionSource: "admin",
      },
      decidedByUserId: input.actorUserId,
      decisionSource: "admin",
      fromOutcomes: ["pending", "manual_review"],
      policyVersion: VALIDATION_POLICY_VERSION,
    })

    const updatedPrayer = await tx.prayer.findUniqueOrThrow({
      where: { id: prayer.id },
      include: { validation: true, scripturePassage: true },
    })

    return {
      updatedPrayer,
      eligibilityResult: applied.eligibilityResult,
      reused: applied.reused,
    }
  })

  return {
    prayer: toPrayerDto(result.updatedPrayer),
    eligibility: result.eligibilityResult,
    reused: result.reused,
  }
}
