import { describe, expect, it, vi } from "vitest"
import {
  BudgetTimeoutError,
  isTransientPrismaPostgresError,
  LOCAL_CONNECT_RETRY,
  SERVERLESS_CONNECT_RETRY,
  withAttemptDeadline,
  withTransientDbRetry,
} from "@/lib/db/transient"

describe("isTransientPrismaPostgresError", () => {
  it("reconhece falha de upstream do proxy Prisma Postgres", () => {
    expect(
      isTransientPrismaPostgresError(
        new Error("Failed to connect to upstream database. Please contact Prisma support"),
      ),
    ).toBe(true)
  })

  it("não trata erro SQL permanente como transitório", () => {
    expect(isTransientPrismaPostgresError(new Error('relation "user" does not exist'))).toBe(
      false,
    )
  })
})

describe("retry budgets", () => {
  it("mantém orçamento serverless abaixo do maxDuration da reconciliação (20s) e orações (25s)", () => {
    expect(SERVERLESS_CONNECT_RETRY.budgetMs).toBeLessThanOrEqual(8_000)
    expect(SERVERLESS_CONNECT_RETRY.attemptTimeoutMs).toBeLessThanOrEqual(
      SERVERLESS_CONNECT_RETRY.budgetMs,
    )
    expect(SERVERLESS_CONNECT_RETRY.budgetMs + 5_000).toBeLessThanOrEqual(20_000)
    expect(LOCAL_CONNECT_RETRY.budgetMs).toBeLessThanOrEqual(12_000)
  })
})

describe("withAttemptDeadline late result", () => {
  it("libera resultado tardio após timeout (PoolClient simulado)", async () => {
    const late: Array<{ released: boolean }> = []
    let resolveConnect: ((value: { released: boolean; release: (x?: boolean) => void }) => void) | null =
      null

    const pending = withAttemptDeadline(
      () =>
        new Promise<{ released: boolean; release: (x?: boolean) => void }>((resolve) => {
          resolveConnect = resolve
        }),
      40,
      {
        onLateResult: (client) => {
          client.release(true)
          late.push(client)
        },
      },
    )

    await expect(pending).rejects.toBeInstanceOf(BudgetTimeoutError)

    const client = {
      released: false,
      release(force?: boolean) {
        this.released = Boolean(force) || true
      },
    }
    resolveConnect!(client)
    await new Promise((r) => setTimeout(r, 20))
    expect(late).toHaveLength(1)
    expect(late[0]!.released).toBe(true)
  })
})

describe("withTransientDbRetry", () => {
  it("repete até sucesso dentro do orçamento", async () => {
    let calls = 0
    const sleep = vi.fn(async () => undefined)
    const result = await withTransientDbRetry(
      async () => {
        calls += 1
        if (calls < 3) throw new Error("Failed to connect to upstream database")
        return "ok"
      },
      { delayMs: 10, maxAttempts: 5, budgetMs: 5_000, attemptTimeoutMs: 1_000, sleep },
    )
    expect(result).toBe("ok")
    expect(calls).toBe(3)
    expect(sleep).toHaveBeenCalled()
  })

  it("não repete erros permanentes", async () => {
    let calls = 0
    await expect(
      withTransientDbRetry(async () => {
        calls += 1
        throw new Error("password authentication failed")
      }),
    ).rejects.toThrow(/password authentication failed/)
    expect(calls).toBe(1)
  })

  it("corta tentativa pendurada antes de estourar o orçamento", async () => {
    const started = Date.now()
    let calls = 0
    await expect(
      withTransientDbRetry(
        async () => {
          calls += 1
          await new Promise(() => {
            /* hang forever */
          })
          return "never"
        },
        {
          budgetMs: 150,
          delayMs: 15,
          maxAttempts: 5,
          attemptTimeoutMs: 40,
          sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
        },
      ),
    ).rejects.toThrow(/budget_exhausted/)

    const elapsed = Date.now() - started
    expect(calls).toBeGreaterThanOrEqual(1)
    expect(calls).toBeLessThanOrEqual(4)
    expect(elapsed).toBeLessThan(800)
  }, 5_000)

  it("respeita deadline com relógio simulado entre tentativas", async () => {
    let now = 0
    const sleep = vi.fn(async (ms: number) => {
      now += ms
    })
    let calls = 0

    await expect(
      withTransientDbRetry(
        async () => {
          calls += 1
          now += 45
          throw new Error("ETIMEDOUT")
        },
        {
          budgetMs: 100,
          delayMs: 20,
          maxAttempts: 10,
          attemptTimeoutMs: 80,
          sleep,
          now: () => now,
        },
      ),
    ).rejects.toThrow(/ETIMEDOUT|budget_exhausted/)

    expect(calls).toBeLessThanOrEqual(3)
    expect(now).toBeLessThanOrEqual(160)
  })

  it("libera conexões tardias em falhas repetidas com pool saturado simulado", async () => {
    const released: number[] = []
    let issued = 0
    let now = 0

    await expect(
      withTransientDbRetry(
        async () => {
          const id = ++issued
          // Simula aquisição lenta que completa depois do attemptTimeout.
          return await new Promise<{ id: number }>((resolve) => {
            setTimeout(() => resolve({ id }), 60)
          })
        },
        {
          budgetMs: 120,
          delayMs: 5,
          maxAttempts: 3,
          attemptTimeoutMs: 25,
          sleep: async (ms) => {
            now += ms
            await new Promise((r) => setTimeout(r, 0))
          },
          now: () => now + Date.now() * 0, // wall for timers; budget via attempt timeouts
          onLateResult: (value) => {
            released.push((value as { id: number }).id)
          },
        },
      ),
    ).rejects.toThrow(/budget_exhausted/)

    await new Promise((r) => setTimeout(r, 120))
    expect(released.length).toBeGreaterThanOrEqual(1)
    expect(issued).toBeGreaterThanOrEqual(1)
  }, 5_000)
})
