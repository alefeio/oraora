import { z } from "zod"
import { failure, ok } from "@/lib/api/http"
import { requireUserApi } from "@/lib/auth/session"
import { DomainError, reconcilePrayerSubmission } from "@/modules/intercession"

/** Consulta leve — orçamento curto. */
export const maxDuration = 15

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
    return failure(400, "Chave de idempotência inválida.")
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
    console.error("prayer_reconcile_failed", {
      name: err instanceof Error ? err.name : "Error",
    })
    return failure(500, "Não foi possível verificar o status do envio.")
  }
}
