import { failure, ok } from "@/lib/api/http"
import { requireUserApi } from "@/lib/auth/session"
import { getReadablePrayerRequestById } from "@/modules/prayer-requests"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { error } = await requireUserApi()
  if (error) return error

  const { id } = await context.params
  if (!id?.trim()) return failure(400, "Identificador inválido.")

  try {
    const prayerRequest = await getReadablePrayerRequestById(id)
    if (!prayerRequest) return failure(404, "Pedido não encontrado.")
    return ok({ prayerRequest })
  } catch {
    return failure(500, "Não foi possível carregar o pedido.")
  }
}
