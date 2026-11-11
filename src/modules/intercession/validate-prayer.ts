import { prisma } from "@/lib/db/prisma"
import { recordAuditEvent } from "@/lib/security/audit"
import { isAdminRole } from "@/lib/auth/policy"
import { DomainError, PrayerNotAllowedError, PrayerNotFoundError } from "./errors"
import { toPrayerDto } from "./dto"
import {
  maybeOpenEligibilityFromAcceptedPrayer,
  rebuildValidPrayerCount,
  lockPrayerRequest,
} from "@/modules/reciprocity/eligibility"
import { VALIDATION_POLICY_VERSION } from "./submit-prayer"

export type DecidePrayerValidationInput = {
  prayerId: string
  actorUserId: string
  outcome: "accepted" | "rejected"
  rationale?: string | null
}

const TRIVIAL_PATTERNS = [/^orei\.?$/i, /^am[eé]m\.?$/i, /^deus\s+aben[cç]oe\.?$/i]

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
    // Idempotente: mesma decisão já registrada.
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

  if (input.outcome === "accepted") {
    const normalized = prayer.body.trim()
    if (TRIVIAL_PATTERNS.some((re) => re.test(normalized))) {
      throw new DomainError(
        "Mensagens genéricas como “orei” ou “amém” não liberam reciprocidade automaticamente. Rejeite ou peça revisão.",
        "TRIVIAL_PRAYER",
        422,
      )
    }
  }

  const effects =
    input.outcome === "accepted"
      ? { reciprocity: true, feedCount: true, solidarity: null }
      : { reciprocity: false, feedCount: false, solidarity: null }

  const result = await prisma.$transaction(async (tx) => {
    // O lock do pedido também serializa decisões de orações diferentes que
    // alteram a mesma projeção validPrayerCount.
    await lockPrayerRequest(tx, prayer.requestId)

    const won = await tx.prayerValidation.updateMany({
      where: {
        prayerId: prayer.id,
        outcome: { in: ["pending", "manual_review"] },
      },
      data: {
        outcome: input.outcome,
        effects,
        rationale: input.rationale?.trim() || null,
        decidedAt: new Date(),
        decidedByUserId: input.actorUserId,
        policyVersion: VALIDATION_POLICY_VERSION,
      },
    })

    if (won.count !== 1) {
      const current = await tx.prayerValidation.findUniqueOrThrow({
        where: { prayerId: prayer.id },
      })
      if (current.outcome !== input.outcome) {
        throw new DomainError(
          "Esta oração já possui uma decisão diferente. Registre uma revisão auditada explícita.",
          "VALIDATION_CONFLICT",
          409,
        )
      }
      const reusedPrayer = await tx.prayer.findUniqueOrThrow({
        where: { id: prayer.id },
        include: { validation: true, scripturePassage: true },
      })
      return {
        updatedPrayer: reusedPrayer,
        eligibilityResult: { opened: false, reason: "unchanged" },
        reused: true as const,
      }
    }

    let eligibilityResult: { opened: boolean; reason: string; eligibilityId?: string } = {
      opened: false,
      reason: "not_applicable",
    }

    if (input.outcome === "accepted") {
      eligibilityResult = await maybeOpenEligibilityFromAcceptedPrayer(tx, {
        userId: prayer.intercessorId,
        prayerId: prayer.id,
        prayerCreatedAt: prayer.createdAt,
      })
      await rebuildValidPrayerCount(tx, prayer.requestId)
    } else {
      await rebuildValidPrayerCount(tx, prayer.requestId)
    }

    const updatedPrayer = await tx.prayer.findUniqueOrThrow({
      where: { id: prayer.id },
      include: { validation: true, scripturePassage: true },
    })

    await recordAuditEvent(
      {
        actorType: "admin",
        actorUserId: input.actorUserId,
        action: "prayer.validation_decided",
        subjectType: "prayer",
        subjectId: prayer.id,
        metadata: {
          outcome: input.outcome,
          eligibility: eligibilityResult,
        },
      },
      tx,
    )

    return { updatedPrayer, eligibilityResult, reused: false as const }
  })

  return {
    prayer: toPrayerDto(result.updatedPrayer),
    eligibility: result.eligibilityResult,
    reused: result.reused,
  }
}
