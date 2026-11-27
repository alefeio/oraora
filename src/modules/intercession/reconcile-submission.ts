import { prisma } from "@/lib/db/prisma"
import { normalizeIdempotencyKey } from "@/lib/security/idempotency"
import { toPrayerDto } from "./dto"
import { DomainError, PrayerNotAllowedError } from "./errors"

export type ReconcileSubmissionResult =
  | { status: "found"; prayer: ReturnType<typeof toPrayerDto>; reused: true }
  | { status: "in_progress" }
  | { status: "not_found" }
  | { status: "unavailable"; reason?: string }

/**
 * Consulta autenticada: descobrir se um envio inconclusivo chegou a gravar a oração.
 * Somente leitura — nunca cria nem reenvia.
 */
export async function reconcilePrayerSubmission(input: {
  intercessorId: string
  idempotencyKey: string
}): Promise<ReconcileSubmissionResult> {
  const idempotencyKey = normalizeIdempotencyKey(input.idempotencyKey)
  if (!idempotencyKey) {
    throw new DomainError("Chave de idempotência inválida.", "INVALID_IDEMPOTENCY_KEY")
  }

  const intercessor = await prisma.user.findUnique({
    where: { id: input.intercessorId },
    select: { id: true, banned: true },
  })
  if (!intercessor || intercessor.banned) {
    throw new PrayerNotAllowedError("Conta indisponível para consultar envios.", "ACCOUNT_SUSPENDED")
  }

  const prayer = await prisma.prayer.findUnique({
    where: {
      intercessorId_idempotencyKey: {
        intercessorId: input.intercessorId,
        idempotencyKey,
      },
    },
    include: { validation: true, scripturePassage: true },
  })
  if (prayer) {
    return { status: "found", prayer: toPrayerDto(prayer), reused: true }
  }

  const reservation = await prisma.idempotencyRecord.findFirst({
    where: {
      scope: "prayer.submit",
      userId: input.intercessorId,
      key: idempotencyKey,
      status: "STARTED",
    },
    select: { id: true },
  })
  if (reservation) {
    return { status: "in_progress" }
  }

  return { status: "not_found" }
}
