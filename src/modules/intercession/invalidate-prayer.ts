import type { Prisma } from "@/generated/prisma/client"
import { isAdminRole } from "@/lib/auth/policy"
import { prisma } from "@/lib/db/prisma"
import { recordAuditEvent } from "@/lib/security/audit"
import { lockPrayerRequest, rebuildValidPrayerCount } from "@/modules/reciprocity/eligibility"
import { toPrayerDto } from "./dto"
import { DomainError, PrayerNotAllowedError, PrayerNotFoundError } from "./errors"

export type InvalidatePrayerValidationInput = {
  prayerId: string
  actorUserId: string
  rationale: string
}

const INVALIDATED_EFFECTS = {
  reciprocity: false,
  feedCount: false,
  solidarity: null,
}

export async function invalidatePrayerValidation(input: InvalidatePrayerValidationInput) {
  const actor = await prisma.user.findUnique({ where: { id: input.actorUserId } })
  if (!actor || actor.banned || !isAdminRole(actor.role)) {
    throw new PrayerNotAllowedError(
      "Apenas administradores ativos podem invalidar.",
      "ADMIN_REQUIRED",
    )
  }

  const rationale = input.rationale.trim()
  if (!rationale) {
    throw new DomainError("Informe a justificativa da invalidação.", "RATIONALE_REQUIRED")
  }

  const prayer = await prisma.prayer.findUnique({
    where: { id: input.prayerId },
    include: { validation: true },
  })
  if (!prayer?.validation) throw new PrayerNotFoundError()
  if (prayer.intercessorId === input.actorUserId) {
    throw new PrayerNotAllowedError(
      "Você não pode invalidar a própria oração.",
      "SELF_VALIDATION_FORBIDDEN",
    )
  }

  return prisma.$transaction(async (tx) => {
    await lockPrayerRequest(tx, prayer.requestId)
    const current = await tx.prayerValidation.findUniqueOrThrow({
      where: { prayerId: prayer.id },
    })
    if (current.outcome !== "accepted") {
      throw new DomainError(
        "Apenas uma oração aceita pode ser invalidada.",
        "VALIDATION_NOT_ACCEPTED",
        409,
      )
    }

    const eligibility = await tx.requestEligibility.findUnique({
      where: { sourcePrayerId: prayer.id },
    })
    let financialCompensationRequired = false
    let compensation = "none"

    if (eligibility?.status === "open") {
      await tx.requestEligibility.update({
        where: { id: eligibility.id },
        data: {
          status: "revoked",
          revokedAt: new Date(),
          revokeReason: "source_prayer_invalidated",
        },
      })
      compensation = "open_eligibility_revoked"
    } else if (eligibility?.status === "consumed") {
      financialCompensationRequired = true
      compensation = "consumed_eligibility_flagged"
      if (eligibility.consumedByRequestId) {
        await tx.prayerRequest.update({
          where: { id: eligibility.consumedByRequestId },
          data: { moderationPending: true },
        })
      }
    }

    await tx.prayerValidation.update({
      where: { id: current.id },
      data: {
        outcome: "rejected",
        effects: INVALIDATED_EFFECTS,
        rationale,
        decidedAt: new Date(),
        decidedByUserId: input.actorUserId,
      },
    })

    const revision = await tx.prayerValidationRevision.create({
      data: {
        validationId: current.id,
        prayerId: prayer.id,
        previousOutcome: current.outcome,
        newOutcome: "rejected",
        rationale,
        actorUserId: input.actorUserId,
        previousEffects: current.effects as Prisma.InputJsonValue,
        newEffects: INVALIDATED_EFFECTS,
        metadata: {
          compensation,
          financialCompensationRequired,
          eligibilityId: eligibility?.id ?? null,
        },
      },
    })

    await rebuildValidPrayerCount(tx, prayer.requestId)
    await recordAuditEvent(
      {
        actorType: "admin",
        actorUserId: input.actorUserId,
        action: "prayer.validation_invalidated",
        subjectType: "prayer",
        subjectId: prayer.id,
        metadata: {
          revisionId: revision.id,
          compensation,
          financialCompensationRequired,
        },
      },
      tx,
    )

    const updated = await tx.prayer.findUniqueOrThrow({
      where: { id: prayer.id },
      include: { validation: true, scripturePassage: true },
    })
    return {
      prayer: toPrayerDto(updated),
      revisionId: revision.id,
      financialCompensationRequired,
    }
  })
}
