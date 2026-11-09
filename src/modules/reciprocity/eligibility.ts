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
 * Concede elegibilidade a partir de oração aceita, respeitando:
 * - no máximo uma open por usuário;
 * - aprovação tardia não reabre direito após publicação posterior à oração.
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
      consumedAt: { gt: input.prayerCreatedAt },
    },
    orderBy: { consumedAt: "desc" },
  })
  if (laterConsumption) {
    return { opened: false, reason: "late_validation_after_publish" }
  }

  try {
    const created = await tx.requestEligibility.create({
      data: {
        userId: input.userId,
        sourceType: "prayer",
        sourcePrayerId: input.prayerId,
        status: "open",
      },
    })
    return { opened: true, reason: "opened", eligibilityId: created.id }
  } catch {
    const stillOpen = await tx.requestEligibility.findFirst({
      where: { userId: input.userId, status: "open" },
    })
    if (stillOpen) {
      return { opened: false, reason: "already_open", eligibilityId: stillOpen.id }
    }
    throw new Error("Falha ao abrir elegibilidade de pedido.")
  }
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
      validation: { outcome: "pending" },
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
        "Sua oração foi recebida. Estamos verificando a interação antes de liberar seu próximo pedido.",
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
