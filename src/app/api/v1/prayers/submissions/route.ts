import { z } from "zod"
import { failure, ok } from "@/lib/api/http"
import { requireUserApi } from "@/lib/auth/session"
import { isTransientPrismaPostgresError } from "@/lib/db/transient"
import { DomainError, reconcilePrayerSubmission } from "@/modules/intercession"

/**
 * Reconciliação: auth + 1–2 consultas.
 * Orçamento de conexão serverless (8s) cabe abaixo deste limite.
 */
export const maxDuration = 20

const querySchema = z.object({
  idempotencyKey: z.string().min(8).max(128),
})

/**
 * Reconciliação autenticada de envio inconclusivo.
 * Somente leitura: não cria oração nem reexecuta a transação.
 */
export async function GET(request: Request) {
  const { session, error } = await requireUserApi()
  if (error) return error

  const url = new URL(request.url)
  const parsed = querySchema.safeParse({
    idempotencyKey: url.searchParams.get("idempotencyKey") ?? "",
  })
  if (!parsed.success) {
    return failure(400, "Chave de idempotência inválida.", { code: "INVALID_IDEMPOTENCY_KEY" })
  }

  try {
    const result = await reconcilePrayerSubmission({
      intercessorId: session!.user.id,
      idempotencyKey: parsed.data.idempotencyKey,
    })
    return ok(result)
  } catch (err) {
    if (err instanceof DomainError) {
      return failure(err.status, err.message, { code: err.code })
    }
    const transient = isTransientPrismaPostgresError(err)
    console.error("prayer_reconcile_failed", {
      transient,
      name: err instanceof Error ? err.name : "Error",
    })
    // 200 com status unavailable: o cliente não deve interpretar como not_found.
    return ok({
      status: "unavailable" as const,
      reason: transient ? "db_transient" : "unexpected",
    })
  }
}
