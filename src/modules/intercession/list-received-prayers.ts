import { prisma } from "@/lib/db/prisma"
import { getPrayerReadAccess } from "./authorization"
import { DomainError, PrayerNotAllowedError } from "./errors"

export type ReceivedPrayerListItem = {
  id: string
  requestId: string
  createdAt: string
  validationOutcome: string
  requestTitle: string
  hasScripture: boolean
}

/**
 * Lista orações recebidas pelo beneficiário autenticado.
 * Somente outcome=accepted (política getPrayerReadAccess).
 * Sem dados privados do intercessor.
 */
export async function listReceivedPrayersForBeneficiary(input: {
  beneficiaryId: string
  limit?: number
}): Promise<ReceivedPrayerListItem[]> {
  const actor = await prisma.user.findUnique({
    where: { id: input.beneficiaryId },
    select: { id: true, role: true, banned: true },
  })
  if (!actor) {
    throw new DomainError("Conta não encontrada.", "ACCOUNT_NOT_FOUND", 404)
  }
  if (actor.banned) {
    throw new PrayerNotAllowedError("Conta indisponível.", "ACCOUNT_SUSPENDED")
  }

  const limit = Math.min(Math.max(input.limit ?? 50, 1), 100)
  const rows = await prisma.prayer.findMany({
    where: {
      beneficiaryId: input.beneficiaryId,
      status: "submitted",
      validation: { outcome: "accepted" },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      requestId: true,
      intercessorId: true,
      beneficiaryId: true,
      createdAt: true,
      scripturePassageId: true,
      validation: { select: { outcome: true } },
      request: { select: { title: true } },
    },
  })

  return rows
    .filter((row) => {
      const access = getPrayerReadAccess(actor, {
        intercessorId: row.intercessorId,
        beneficiaryId: row.beneficiaryId,
        validation: row.validation,
      })
      return access === "allowed"
    })
    .map((row) => ({
      id: row.id,
      requestId: row.requestId,
      createdAt: row.createdAt.toISOString(),
      validationOutcome: row.validation?.outcome ?? "accepted",
      requestTitle: row.request.title,
      hasScripture: Boolean(row.scripturePassageId),
    }))
}
