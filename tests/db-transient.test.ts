import { describe, expect, it, vi } from "vitest"
import {
  isTransientPrismaPostgresError,
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
})
