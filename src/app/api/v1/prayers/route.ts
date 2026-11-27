import { z } from "zod"
import { failure, ok } from "@/lib/api/http"
import { requireUserApi } from "@/lib/auth/session"
import { isTransientPrismaPostgresError } from "@/lib/db/transient"
import { DomainError, submitPrayer } from "@/modules/intercession"

/** Abaixo do orçamento de retry de conexão serverless (~16s) + margem de trabalho. */
export const maxDuration = 25

const bodySchema = z.object({
  requestId: z.string().min(1),
  body: z.string().min(1).max(10_000),
  scripturePassageId: z.string().min(1).optional().nullable(),
  idempotencyKey: z.string().min(8).max(128),
})

export async function POST(request: Request) {
  const { session, error } = await requireUserApi()
  if (error) return error

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
    const result = await submitPrayer({
      intercessorId: session!.user.id,
      requestId: parsed.data.requestId,
      body: parsed.data.body,
      scripturePassageId: parsed.data.scripturePassageId,
      idempotencyKey: parsed.data.idempotencyKey,
    })
    return ok(result, result.reused ? 200 : 201)
  } catch (err) {
    if (err instanceof DomainError) {
      return failure(err.status, err.message, { code: err.code })
    }
    const transient = isTransientPrismaPostgresError(err)
    console.error("prayer_submit_failed", {
      transient,
      name: err instanceof Error ? err.name : "Error",
      // Sem PII / sem corpo da oração.
    })
    return failure(
      transient ? 503 : 500,
      transient
        ? "O serviço de dados está temporariamente indisponível. Seu texto foi preservado — tente novamente com o mesmo envio."
        : "Não foi possível enviar a oração.",
      { code: transient ? "DB_TRANSIENT" : "PRAYER_SUBMIT_FAILED", inconclusive: true },
    )
  }
}
