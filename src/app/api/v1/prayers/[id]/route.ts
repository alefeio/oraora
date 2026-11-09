import { failure, ok } from "@/lib/api/http"
import { requireUserApi } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { isAdminRole } from "@/lib/auth/policy"
import { toPrayerDto } from "@/modules/intercession"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const { session, error } = await requireUserApi()
  if (error) return error

  const { id } = await context.params
  const prayer = await prisma.prayer.findUnique({
    where: { id },
    include: { validation: true, scripturePassage: true },
  })
  if (!prayer) return failure(404, "Oração não encontrada.")

  const isOwner = prayer.intercessorId === session!.user.id
  const isBeneficiary = prayer.beneficiaryId === session!.user.id
  const isAdmin = isAdminRole(session!.user.role)
  if (!isOwner && !isBeneficiary && !isAdmin) {
    return failure(403, "Acesso negado.")
  }

  // Beneficiário só vê orações aceitas
  if (isBeneficiary && !isOwner && !isAdmin) {
    if (prayer.validation?.outcome !== "accepted") {
      return failure(404, "Oração não encontrada.")
    }
  }

  return ok({ prayer: toPrayerDto(prayer) })
}
