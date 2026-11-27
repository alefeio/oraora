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
    /ETIMEDOUT/i.test(message) ||
    /budget_exhausted/i.test(message)
  )
}

export type TransientRetryOptions = {
  /** Orçamento total para tentativas (ms). */
  budgetMs?: number
  /** Atraso base entre tentativas (ms); cresce linearmente. */
  delayMs?: number
  /** Máximo de tentativas (inclui a primeira). */
  maxAttempts?: number
  /**
   * Teto por tentativa individual. Nunca excede o tempo restante do orçamento.
   * Sem valor, cada tentativa usa apenas o restante do prazo.
   */
  attemptTimeoutMs?: number
  sleep?: (ms: number) => Promise<void>
  now?: () => number
}

/**
 * Orçamento de conexão serverless: cabe sob maxDuration da reconciliação (20s)
 * e das rotas de oração/health (25s), deixando margem para auth + consultas + TX.
 */
export const SERVERLESS_CONNECT_RETRY: Required<
  Pick<TransientRetryOptions, "budgetMs" | "delayMs" | "maxAttempts" | "attemptTimeoutMs">
> = {
  budgetMs: 8_000,
  delayMs: 400,
  maxAttempts: 3,
  attemptTimeoutMs: 3_500,
}

/** Local / testes: um pouco mais paciente, sem competir com limite de função. */
export const LOCAL_CONNECT_RETRY: Required<
  Pick<TransientRetryOptions, "budgetMs" | "delayMs" | "maxAttempts" | "attemptTimeoutMs">
> = {
  budgetMs: 12_000,
  delayMs: 500,
  maxAttempts: 4,
  attemptTimeoutMs: 4_000,
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

class BudgetTimeoutError extends Error {
  constructor(remainingMs: number) {
    super(`budget_exhausted: attempt exceeded remaining ${remainingMs}ms`)
    this.name = "BudgetTimeoutError"
  }
}

async function withAttemptDeadline<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  now: () => number,
): Promise<T> {
  if (timeoutMs <= 0) throw new BudgetTimeoutError(timeoutMs)

  let timer: ReturnType<typeof setTimeout> | undefined
  const started = now()
  try {
    return await Promise.race([
      operation(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new BudgetTimeoutError(Math.max(0, timeoutMs - (now() - started))))
        }, timeoutMs)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

/**
 * Repete operações de conexão/consulta quando o upstream Prisma Postgres está frio.
 * Erros permanentes são relançados imediatamente.
 * Cada tentativa é limitada ao tempo restante do orçamento (e a attemptTimeoutMs).
 */
export async function withTransientDbRetry<T>(
  operation: () => Promise<T>,
  options: TransientRetryOptions = {},
): Promise<T> {
  const budgetMs = options.budgetMs ?? LOCAL_CONNECT_RETRY.budgetMs
  const delayMs = options.delayMs ?? LOCAL_CONNECT_RETRY.delayMs
  const maxAttempts = options.maxAttempts ?? LOCAL_CONNECT_RETRY.maxAttempts
  const attemptTimeoutMs = options.attemptTimeoutMs ?? LOCAL_CONNECT_RETRY.attemptTimeoutMs
  const sleep = options.sleep ?? defaultSleep
  const now = options.now ?? Date.now
  const deadline = now() + budgetMs

  let attempt = 0
  let lastError: unknown

  while (attempt < maxAttempts) {
    const remainingBefore = deadline - now()
    if (remainingBefore <= 0) break

    attempt += 1
    const attemptCap = Math.min(attemptTimeoutMs, remainingBefore)

    try {
      return await withAttemptDeadline(operation, attemptCap, now)
    } catch (error) {
      lastError = error
      if (!isTransientPrismaPostgresError(error)) throw error

      const remainingAfter = deadline - now()
      if (attempt >= maxAttempts || remainingAfter <= 0) break

      const wait = Math.min(delayMs * attempt, 1_500, remainingAfter)
      if (wait <= 0) break

      console.warn("transient_db_retry", {
        attempt,
        waitMs: wait,
        remainingBudgetMs: remainingAfter,
        attemptCapMs: attemptCap,
      })
      await sleep(wait)
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new BudgetTimeoutError(Math.max(0, deadline - now()))
}
