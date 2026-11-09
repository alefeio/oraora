import { createHash } from "node:crypto"
import { prisma } from "@/lib/db/prisma"
import { recordAuditEvent } from "@/lib/security/audit"
import { normalizeIdempotencyKey } from "@/lib/security/idempotency"
import { DomainError, PrayerNotAllowedError } from "./errors"
import { toPrayerDto } from "./dto"

const MIN_MEANINGFUL_BODY = 1
export const VALIDATION_POLICY_VERSION = 1

export type SubmitPrayerInput = {
  intercessorId: string
  requestId: string
  body: string
  scripturePassageId?: string | null
  idempotencyKey: string
}

export async function submitPrayer(input: SubmitPrayerInput) {
  const idempotencyKey = normalizeIdempotencyKey(input.idempotencyKey)
  if (!idempotencyKey) {
    throw new DomainError("Chave de idempotência inválida.", "INVALID_IDEMPOTENCY_KEY")
  }

  const body = input.body.replace(/\r\n/g, "\n").trim()
  if (body.length < MIN_MEANINGFUL_BODY) {
    throw new DomainError("Escreva uma oração antes de enviar.", "PRAYER_BODY_REQUIRED")
  }

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
    return { prayer: toPrayerDto(existing), reused: true as const }
  }

  const request = await prisma.prayerRequest.findUnique({
    where: { id: input.requestId },
  })
  if (!request || request.status === "removed") {
    throw new PrayerNotAllowedError("Este pedido não recebe novas orações.", "REQUEST_NOT_ACCEPTING")
  }
  if (request.status === "closed") {
    throw new PrayerNotAllowedError("Este pedido está encerrado.", "REQUEST_CLOSED")
  }
  if (request.contentVisibility !== "authenticated") {
    throw new PrayerNotAllowedError("Você não tem acesso a este pedido.", "REQUEST_RESTRICTED")
  }
  if (request.authorId === input.intercessorId) {
    throw new PrayerNotAllowedError("Você não pode orar pelo próprio pedido.", "SELF_PRAYER_FORBIDDEN")
  }

  let scripturePassageId: string | null = null
  if (input.scripturePassageId) {
    const passage = await prisma.scripturePassage.findFirst({
      where: { id: input.scripturePassageId, active: true },
    })
    if (!passage) {
      throw new DomainError("Passagem bíblica inválida.", "SCRIPTURE_NOT_FOUND", 404)
    }
    scripturePassageId = passage.id
  }

  const contentHash = createHash("sha256").update(body.normalize("NFKC").toLowerCase()).digest("hex")

  try {
    const prayer = await prisma.prayer.create({
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
            },
          },
        },
      },
      include: { validation: true, scripturePassage: true },
    })

    await recordAuditEvent({
      actorType: "user",
      actorUserId: input.intercessorId,
      action: "prayer.submitted",
      subjectType: "prayer",
      subjectId: prayer.id,
      metadata: {
        requestId: request.id,
        hasScripture: Boolean(scripturePassageId),
      },
    })

    return { prayer: toPrayerDto(prayer), reused: false as const }
  } catch (error) {
    // Corrida de idempotência: outra requisição criou primeiro.
    const raced = await prisma.prayer.findUnique({
      where: {
        intercessorId_idempotencyKey: {
          intercessorId: input.intercessorId,
          idempotencyKey,
        },
      },
      include: { validation: true, scripturePassage: true },
    })
    if (raced) return { prayer: toPrayerDto(raced), reused: true as const }
    throw error
  }
}
