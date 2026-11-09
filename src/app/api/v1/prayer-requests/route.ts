import { failure, ok } from "@/lib/api/http"
import { requireUserApi } from "@/lib/auth/session"
import { listFeedPrayerRequests } from "@/modules/prayer-requests"

export async function GET(request: Request) {
  const { error } = await requireUserApi()
  if (error) return error

  const url = new URL(request.url)
  const categorySlug = url.searchParams.get("category")?.trim() || undefined

  try {
    const prayerRequests = await listFeedPrayerRequests({ categorySlug })
    return ok({
      prayerRequests,
      meta: {
        ranking: "solidarity-feed",
        note: "Ordenação prioriza quem recebeu menos orações, conforme política versionada.",
      },
    })
  } catch {
    return failure(500, "Não foi possível carregar o feed.")
  }
}

/**
 * Criação pública bloqueada na Sprint 1.
 * Reciprocidade (Sprint 2) será pré-requisito transacional.
 */
export async function POST() {
  return failure(
    403,
    "A publicação de pedidos ainda não está disponível. É necessário primeiro orar por alguém.",
    { code: "PRAYER_REQUEST_CREATION_BLOCKED" },
  )
}
