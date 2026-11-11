import { z } from "zod"
import { failure, ok } from "@/lib/api/http"
import { requireAdminApi } from "@/lib/auth/session"
import { DomainError, decidePrayerValidation } from "@/modules/intercession"

const bodySchema = z.object({
  outcome: z.enum(["accepted", "rejected"]),
  rationale: z.string().max(2000).optional().nullable(),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
  const { session, error } = await requireAdminApi()
  if (error) return error

  const { id } = await context.params
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return failure(400, "JSON inválido.")
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return failure(400, "Dados inválidos.", parsed.error.flatten())
  }

  try {
    const result = await decidePrayerValidation({
      prayerId: id,
      actorUserId: session!.user.id,
      outcome: parsed.data.outcome,
      rationale: parsed.data.rationale,
    })
    return ok(result)
  } catch (err) {
    if (err instanceof DomainError) {
      return failure(err.status, err.message, { code: err.code })
    }
    return failure(500, "Não foi possível registrar a validação.")
  }
}
