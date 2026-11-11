import { z } from "zod"
import { failure, ok } from "@/lib/api/http"
import { requireUserApi } from "@/lib/auth/session"
import { DomainError } from "@/modules/intercession"
import { createPrayerRequest, listFeedPrayerRequests } from "@/modules/prayer-requests"
import { PUBLIC_IDENTITY_MODES } from "@/modules/prayer-requests/types"

const createSchema = z.object({
  categoryId: z.string().min(1),
  title: z.string().min(1).max(200),
  story: z.string().min(1).max(20_000),
  prayerNeed: z.string().min(1).max(5_000),
  publicIdentityMode: z.enum(PUBLIC_IDENTITY_MODES),
  idempotencyKey: z.string().min(8).max(128),
})

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

export async function POST(request: Request) {
  const { session, error } = await requireUserApi()
  if (error) return error

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return failure(400, "JSON inválido.")
  }

  const parsed = createSchema.safeParse(json)
  if (!parsed.success) {
    return failure(400, "Dados inválidos.", parsed.error.flatten())
  }

  try {
    const result = await createPrayerRequest({
      authorId: session!.user.id,
      ...parsed.data,
    })
    return ok(result, result.reused ? 200 : 201)
  } catch (err) {
    if (err instanceof DomainError) {
      return failure(err.status, err.message, { code: err.code })
    }
    return failure(500, "Não foi possível criar o pedido.")
  }
}
