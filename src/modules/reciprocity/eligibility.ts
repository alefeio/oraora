import type { Prisma, PrismaClient } from "@/generated/prisma/client"
import { prisma } from "@/lib/db/prisma"

type Db = PrismaClient | Prisma.TransactionClient

export type EligibilitySnapshot = {
  status: "none" | "pending_review" | "open"
  openEligibilityId: string | null
  pendingPrayerId: string | null
  message: string
  canPublish: boolean
}

/**
 * Serializa operações do mesmo intercessor (frequência, elegibilidade).
 * Ordem canônica de locks: usuário → pedido (evita deadlock).
 */
export async function lockIntercessorUser(tx: Prisma.TransactionClient, userId: string) {
  await tx.user.update({
    where: { id: userId },
    data: { updatedAt: new Date() },
  })
}

/**
 * Concede elegibilidade a partir de oração aceita, respeitando:
 * - no máximo uma open por usuário;
 * - aprovação tardia não reabre direito após publicação posterior à oração.
 *
 * Exige que o chamador já tenha serializado o usuário (`lockIntercessorUser`)
 * quando houver risco de concorrência — não tenta ler após P2002 na mesma TX.
 */
export async function maybeOpenEligibilityFromAcceptedPrayer(
  tx: Db,
  input: {
    userId: string
    prayerId: string
    prayerCreatedAt: Date
  },
): Promise<{ opened: boolean; reason: string; eligibilityId?: string }> {
  const existingFromPrayer = await tx.requestEligibility.findUnique({
    where: { sourcePrayerId: input.prayerId },
  })
  if (existingFromPrayer) {
    return { opened: false, reason: "already_linked", eligibilityId: existingFromPrayer.id }
  }

  const open = await tx.requestEligibility.findFirst({
    where: { userId: input.userId, status: "open" },
  })
  if (open) {
    return { opened: false, reason: "already_open", eligibilityId: open.id }
  }

  const laterConsumption = await tx.requestEligibility.findFirst({
    where: {
      userId: input.userId,
      status: "consumed",
      consumedByRequest: {
        createdAt: { gt: input.prayerCreatedAt },
      },
    },
    orderBy: { consumedByRequest: { createdAt: "desc" } },
  })
  if (laterConsumption) {
    return { opened: false, reason: "late_validation_after_publish" }
  }

  const created = await tx.requestEligibility.create({
    data: {
      userId: input.userId,
      sourceType: "prayer",
      sourcePrayerId: input.prayerId,
      status: "open",
    },
  })
  return { opened: true, reason: "opened", eligibilityId: created.id }
}

export async function getRequestEligibilitySnapshot(userId: string): Promise<EligibilitySnapshot> {
  const open = await prisma.requestEligibility.findFirst({
    where: { userId, status: "open" },
  })
  if (open) {
    return {
      status: "open",
      openEligibilityId: open.id,
      pendingPrayerId: null,
      canPublish: true,
      message: "Você cuidou de alguém. Agora, se precisar, também pode pedir uma oração.",
    }
  }

  const pending = await prisma.prayer.findFirst({
    where: {
      intercessorId: userId,
      validation: { outcome: { in: ["pending", "manual_review"] } },
    },
    orderBy: { createdAt: "desc" },
  })
  if (pending) {
    return {
      status: "pending_review",
      openEligibilityId: null,
      pendingPrayerId: pending.id,
      canPublish: false,
      message:
        "Sua oração foi recebida. Estamos verificando esta interação para manter nossa comunidade segura.",
    }
  }

  return {
    status: "none",
    openEligibilityId: null,
    pendingPrayerId: null,
    canPublish: false,
    message: "Antes de pedir uma oração, ore por alguém.",
  }
}

export async function rebuildValidPrayerCount(tx: Db, requestId: string) {
  const rows = await tx.prayer.findMany({
    where: { requestId, status: "submitted" },
    include: { validation: true },
  })

  const count = rows.filter((row) => {
    if (!row.validation || row.validation.outcome !== "accepted") return false
    const effects = row.validation.effects as { feedCount?: boolean | null }
    return effects.feedCount === true
  }).length

  await tx.prayerRequest.update({
    where: { id: requestId },
    data: { validPrayerCount: count },
  })
  return count
}

/**
 * Serializa alterações de validação que afetam o mesmo pedido.
 * Usa UPDATE do Prisma (trava a linha até o fim da TX) — evita $queryRaw no adapter-pg.
 */
export async function lockPrayerRequest(tx: Prisma.TransactionClient, requestId: string) {
  await tx.prayerRequest.update({
    where: { id: requestId },
    data: { updatedAt: new Date() },
  })
}
