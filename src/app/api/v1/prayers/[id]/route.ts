import { failure, ok } from "@/lib/api/http"
import { requireUserApi } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { toPrayerDto } from "@/modules/intercession"
import { getPrayerReadAccess } from "@/modules/intercession/authorization"

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

  const actor = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { id: true, role: true, banned: true },
  })
  if (!actor) return failure(403, "Acesso negado.")
  const access = getPrayerReadAccess(actor, prayer)
  if (access === "forbidden") return failure(403, "Acesso negado.")
  if (access === "hidden") return failure(404, "Oração não encontrada.")

  return ok({ prayer: toPrayerDto(prayer) })
}
