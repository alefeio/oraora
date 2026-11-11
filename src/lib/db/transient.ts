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

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * Repete operações de conexão/consulta quando o upstream Prisma Postgres está frio.
 * Erros permanentes são relançados imediatamente.
 */
export async function withTransientDbRetry<T>(
  operation: () => Promise<T>,
  options: TransientRetryOptions = {},
): Promise<T> {
  const budgetMs = options.budgetMs ?? 45_000
  const delayMs = options.delayMs ?? 1_500
  const maxAttempts = options.maxAttempts ?? 6
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
      const wait = Math.min(delayMs * attempt, 5_000)
      const remaining = deadline - Date.now()
      if (remaining <= 0) break
      await sleep(Math.min(wait, remaining))
    }
  }

  throw lastError
}
