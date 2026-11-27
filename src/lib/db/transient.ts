/**
 * Erros transitórios conhecidos do proxy Prisma Postgres (cold-start / scale-to-zero).
 * Não inclui falhas de autenticação, DNS permanente ou SQL inválido.
 */
export function isTransientPrismaPostgresError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return (
    /Failed to connect to upstream database/i.test(message) ||
    /Connection terminated unexpectedly/i.test(message) ||
    /timeout expired/i.test(message) ||
    /Connection terminated due to connection timeout/i.test(message) ||
    /ECONNRESET/i.test(message) ||
    /ETIMEDOUT/i.test(message)
  )
}

export type TransientRetryOptions = {
  /** Orçamento total para tentativas (ms). */
  budgetMs?: number
  /** Atraso base entre tentativas (ms); cresce linearmente. */
  delayMs?: number
  /** Máximo de tentativas (inclui a primeira). */
  maxAttempts?: number
  sleep?: (ms: number) => Promise<void>
}

/**
 * Orçamento de conexão para serverless: cabe abaixo de maxDuration típico (25–30s)
 * e do tempo que o cliente aguarda a resposta.
 */
export const SERVERLESS_CONNECT_RETRY: Required<
  Pick<TransientRetryOptions, "budgetMs" | "delayMs" | "maxAttempts">
> = {
  budgetMs: 16_000,
  delayMs: 700,
  maxAttempts: 3,
}

/** Local / testes: um pouco mais paciente, sem competir com limite de função. */
export const LOCAL_CONNECT_RETRY: Required<
  Pick<TransientRetryOptions, "budgetMs" | "delayMs" | "maxAttempts">
> = {
  budgetMs: 20_000,
  delayMs: 1_000,
  maxAttempts: 4,
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * Repete operações de conexão/consulta quando o upstream Prisma Postgres está frio.
 * Erros permanentes são relançados imediatamente.
 */
export async function withTransientDbRetry<T>(
  operation: () => Promise<T>,
  options: TransientRetryOptions = {},
): Promise<T> {
  const budgetMs = options.budgetMs ?? LOCAL_CONNECT_RETRY.budgetMs
  const delayMs = options.delayMs ?? LOCAL_CONNECT_RETRY.delayMs
  const maxAttempts = options.maxAttempts ?? LOCAL_CONNECT_RETRY.maxAttempts
  const sleep = options.sleep ?? defaultSleep
  const deadline = Date.now() + budgetMs

  let attempt = 0
  let lastError: unknown

  while (attempt < maxAttempts && Date.now() < deadline) {
    attempt += 1
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (!isTransientPrismaPostgresError(error)) throw error
      if (attempt >= maxAttempts || Date.now() >= deadline) break
      const wait = Math.min(delayMs * attempt, 3_000)
      const remaining = deadline - Date.now()
      if (remaining <= 0) break
      console.warn("transient_db_retry", {
        attempt,
        waitMs: Math.min(wait, remaining),
        remainingBudgetMs: remaining,
      })
      await sleep(Math.min(wait, remaining))
    }
  }

  throw lastError
}
