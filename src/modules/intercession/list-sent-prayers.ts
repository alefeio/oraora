import { prisma } from "@/lib/db/prisma"
import { DomainError, PrayerNotAllowedError } from "./errors"

export type SentPrayerListItem = {
  id: string
  requestId: string
  createdAt: string
  status: string
  validationOutcome: string | null
  requestTitle: string
  requestPublicLabel: string
  hasScripture: boolean
}

/**
 * Lista orações enviadas pelo intercessor autenticado (titularidade).
 * Somente leitura — sem corpo da oração na listagem.
 */
export async function listSentPrayersForIntercessor(input: {
  intercessorId: string
  limit?: number
}): Promise<SentPrayerListItem[]> {
  const actor = await prisma.user.findUnique({
    where: { id: input.intercessorId },
    select: { id: true, banned: true },
  })
  if (!actor) {
    throw new DomainError("Conta não encontrada.", "ACCOUNT_NOT_FOUND", 404)
  }
  if (actor.banned) {
    throw new PrayerNotAllowedError("Conta indisponível.", "ACCOUNT_SUSPENDED")
  }

  const limit = Math.min(Math.max(input.limit ?? 50, 1), 100)
  const rows = await prisma.prayer.findMany({
    where: { intercessorId: input.intercessorId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      requestId: true,
      createdAt: true,
      status: true,
      scripturePassageId: true,
      validation: { select: { outcome: true } },
      request: { select: { title: true, publicLabel: true } },
    },
  })

  return rows.map((row) => ({
    id: row.id,
    requestId: row.requestId,
    createdAt: row.createdAt.toISOString(),
    status: row.status,
    validationOutcome: row.validation?.outcome ?? null,
    requestTitle: row.request.title,
    requestPublicLabel: row.request.publicLabel,
    hasScripture: Boolean(row.scripturePassageId),
  }))
}
