import { describe, expect, it } from "vitest"
import { assertDatabaseWriteAllowed } from "@/lib/db/guards"

describe("database write guards", () => {
  it("permite host local", () => {
    const target = assertDatabaseWriteAllowed({
      DATABASE_URL: "postgresql://intercessao:x@127.0.0.1:55433/intercessao_dev",
    })
    expect(target.local).toBe(true)
    expect(target.database).toBe("intercessao_dev")
  })

  it("bloqueia host remoto sem autorização", () => {
    expect(() =>
      assertDatabaseWriteAllowed({
        DATABASE_URL: "postgresql://user:pass@db.example.com:5432/prod",
      }),
    ).toThrow(/Escrita bloqueada/)
  })

  it("bloqueia VERCEL_ENV=production", () => {
    expect(() =>
      assertDatabaseWriteAllowed({
        VERCEL_ENV: "production",
        DATABASE_URL: "postgresql://intercessao:x@127.0.0.1:55433/intercessao_dev",
      }),
    ).toThrow(/production/)
  })
})
