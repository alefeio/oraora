import { describe, expect, it, vi } from "vitest"
import {
  isTransientPrismaPostgresError,
  LOCAL_CONNECT_RETRY,
  SERVERLESS_CONNECT_RETRY,
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
  it("mantém orçamento serverless abaixo do maxDuration das rotas (25s)", () => {
    expect(SERVERLESS_CONNECT_RETRY.budgetMs).toBeLessThan(25_000)
    expect(SERVERLESS_CONNECT_RETRY.maxAttempts).toBeLessThanOrEqual(3)
    expect(LOCAL_CONNECT_RETRY.budgetMs).toBeLessThanOrEqual(20_000)
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
      { delayMs: 10, maxAttempts: 5, budgetMs: 5_000, sleep },
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

  it("esgota orçamento sem reexecutar além do limite", async () => {
    let calls = 0
    const sleep = vi.fn(async () => undefined)
    await expect(
      withTransientDbRetry(
        async () => {
          calls += 1
          throw new Error("timeout expired")
        },
        { delayMs: 1, maxAttempts: 3, budgetMs: 50, sleep },
      ),
    ).rejects.toThrow(/timeout expired/)
    expect(calls).toBeLessThanOrEqual(3)
  })
})
