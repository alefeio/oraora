import { createHash } from "node:crypto"
import { prisma } from "@/lib/db/prisma"
import { recordAuditEvent } from "@/lib/security/audit"
import { fingerprintPayload, normalizeIdempotencyKey } from "@/lib/security/idempotency"
import { applyValidationDecision } from "./apply-validation"
import { DomainError, PrayerNotAllowedError } from "./errors"
import { toPrayerDto } from "./dto"
import {
  ABUSE_RATE_LIMITS,
  classifyPrayerSubmission,
  VALIDATION_POLICY_VERSION,
} from "./validation-policy-v2"

export { VALIDATION_POLICY_VERSION }

export type SubmitPrayerInput = {
  intercessorId: string
  requestId: string
  body: string
  scripturePassageId?: string | null
  idempotencyKey: string
}

function normalizeScripturePassageId(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function sameIdempotentPayload(
  existing: {
    requestId: string
    contentHash: string
    scripturePassageId: string | null
  },
  expected: {
    requestId: string
    contentHash: string
    scripturePassageId: string | null
  },
) {
  return (
    existing.requestId === expected.requestId &&
    existing.contentHash === expected.contentHash &&
    (existing.scripturePassageId ?? null) === (expected.scripturePassageId ?? null)
  )
}

export async function submitPrayer(input: SubmitPrayerInput) {
  const idempotencyKey = normalizeIdempotencyKey(input.idempotencyKey)
  if (!idempotencyKey) {
    throw new DomainError("Chave de idempotência inválida.", "INVALID_IDEMPOTENCY_KEY")
  }

  const body = input.body.replace(/\r\n/g, "\n").trim()
  const contentHash = createHash("sha256")
    .update(body.normalize("NFKC").toLowerCase())
    .digest("hex")
  const requestedScripturePassageId = normalizeScripturePassageId(input.scripturePassageId)
  const requestHash = fingerprintPayload({
    requestId: input.requestId,
    body,
    scripturePassageId: requestedScripturePassageId,
  })

  const intercessor = await prisma.user.findUnique({ where: { id: input.intercessorId } })
  if (!intercessor || intercessor.banned) {
    throw new PrayerNotAllowedError("Conta indisponível para orar.", "ACCOUNT_SUSPENDED")
  }

  const existing = await prisma.prayer.findUnique({
    where: {
      intercessorId_idempotencyKey: {
        intercessorId: input.intercessorId,
        idempotencyKey,
      },
    },
    include: { validation: true, scripturePassage: true },
  })
  if (existing) {
    if (
      !sameIdempotentPayload(existing, {
        requestId: input.requestId,
        contentHash,
        scripturePassageId: requestedScripturePassageId,
      })
    ) {
      throw new DomainError(
        "Esta chave de idempotência já foi usada com outra oração.",
        "IDEMPOTENCY_PAYLOAD_CONFLICT",
        409,
      )
    }
    return { prayer: toPrayerDto(existing), reused: true as const }
  }

  const prior = await prisma.idempotencyRecord.findFirst({
    where: { scope: "prayer.submit", userId: input.intercessorId, key: idempotencyKey },
  })
  if (prior && prior.requestHash !== requestHash) {
    throw new DomainError(
      "Esta chave de idempotência já foi usada com outra oração.",
      "IDEMPOTENCY_PAYLOAD_CONFLICT",
      409,
    )
  }

  const request = await prisma.prayerRequest.findUnique({
    where: { id: input.requestId },
  })
  if (!request || request.status === "removed") {
    throw new PrayerNotAllowedError(
      "Este pedido não recebe novas orações.",
      "REQUEST_NOT_ACCEPTING",
    )
  }
  if (request.status === "closed") {
    throw new PrayerNotAllowedError("Este pedido está encerrado.", "REQUEST_CLOSED")
  }
  if (request.contentVisibility !== "authenticated") {
    throw new PrayerNotAllowedError("Você não tem acesso a este pedido.", "REQUEST_RESTRICTED")
  }
  if (request.authorId === input.intercessorId) {
    throw new PrayerNotAllowedError(
      "Você não pode orar pelo próprio pedido.",
      "SELF_PRAYER_FORBIDDEN",
    )
  }

  let scripturePassageId: string | null = null
  if (requestedScripturePassageId) {
    const passage = await prisma.scripturePassage.findFirst({
      where: { id: requestedScripturePassageId, active: true },
    })
    if (!passage) {
      throw new DomainError("Passagem bíblica inválida.", "SCRIPTURE_NOT_FOUND", 404)
    }
    scripturePassageId = passage.id
  }

  const windowStart = new Date(Date.now() - ABUSE_RATE_LIMITS.windowMs)
  const [submissionsInWindow, duplicateHashCount] = await Promise.all([
    prisma.prayer.count({
      where: {
        intercessorId: input.intercessorId,
        createdAt: { gte: windowStart },
      },
    }),
    prisma.prayer.count({
      where: {
        intercessorId: input.intercessorId,
        contentHash,
        createdAt: { gte: windowStart },
      },
    }),
  ])

  const classification = classifyPrayerSubmission({
    body,
    submissionsInWindow,
    duplicateHashCount,
  })

  if (classification.kind === "block_before_submit") {
    throw new DomainError(classification.message, classification.code, 422)
  }

  try {
    const prayer = await prisma.$transaction(async (tx) => {
      const reservation = await tx.idempotencyRecord.create({
        data: {
          scope: "prayer.submit",
          key: idempotencyKey,
          requestHash,
          status: "STARTED",
          userId: input.intercessorId,
        },
      })

      // Cria com pending transitório e aplica decisão na mesma TX (atômico).
      const created = await tx.prayer.create({
        data: {
          requestId: request.id,
          intercessorId: input.intercessorId,
          beneficiaryId: request.authorId,
          medium: "text",
          body,
          scripturePassageId,
          status: "submitted",
          contentHash,
          idempotencyKey,
          validation: {
            create: {
              policyVersion: VALIDATION_POLICY_VERSION,
              outcome: "pending",
              effects: {
                reciprocity: null,
                feedCount: null,
                solidarity: null,
              },
              signals: {
                bodyLength: body.length,
                hasScripture: Boolean(scripturePassageId),
                contentHash,
                classificationSignals: classification.signals,
                decisionSource: "system_auto",
              },
            },
          },
        },
        include: { validation: true, scripturePassage: true },
      })

      await applyValidationDecision(tx, {
        prayerId: created.id,
        requestId: request.id,
        intercessorId: input.intercessorId,
        prayerCreatedAt: created.createdAt,
        outcome: classification.outcome,
        effects: classification.effects,
        rationale: classification.rationale,
        signals: {
          bodyLength: body.length,
          hasScripture: Boolean(scripturePassageId),
          contentHash,
          classificationSignals: classification.signals,
          decisionSource: "system_auto",
          submissionsInWindow,
          duplicateHashCount,
        },
        decidedByUserId: null,
        decisionSource: "system_auto",
        fromOutcomes: ["pending"],
      })

      await tx.idempotencyRecord.update({
        where: { id: reservation.id },
        data: {
          status: "COMPLETED",
          responseStatus: 201,
          responseBody: {
            prayerId: created.id,
            validationOutcome: classification.outcome,
          },
        },
      })
      await recordAuditEvent(
        {
          actorType: "user",
          actorUserId: input.intercessorId,
          action: "prayer.submitted",
          subjectType: "prayer",
          subjectId: created.id,
          metadata: {
            requestId: request.id,
            hasScripture: Boolean(scripturePassageId),
            validationOutcome: classification.outcome,
            policyVersion: VALIDATION_POLICY_VERSION,
          },
        },
        tx,
      )

      return tx.prayer.findUniqueOrThrow({
        where: { id: created.id },
        include: { validation: true, scripturePassage: true },
      })
    })

    return { prayer: toPrayerDto(prayer), reused: false as const }
  } catch (error) {
    const raced = await prisma.prayer.findUnique({
      where: {
        intercessorId_idempotencyKey: {
          intercessorId: input.intercessorId,
          idempotencyKey,
        },
      },
      include: { validation: true, scripturePassage: true },
    })
    if (raced) {
      if (
        !sameIdempotentPayload(raced, {
          requestId: input.requestId,
          contentHash,
          scripturePassageId: requestedScripturePassageId,
        })
      ) {
        throw new DomainError(
          "Esta chave de idempotência já foi usada com outra oração.",
          "IDEMPOTENCY_PAYLOAD_CONFLICT",
          409,
        )
      }
      return { prayer: toPrayerDto(raced), reused: true as const }
    }
    throw error
  }
}
