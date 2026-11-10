import { describe, expect, it } from "vitest"
import { assertDatabaseWriteAllowed, assertTestRuntimeIsLocal } from "@/lib/db/guards"
import { resolveRuntimeDatabaseUrl } from "@/lib/db/connection"

describe("database write guards", () => {
  it("permite host local com database autorizado", () => {
    const target = assertDatabaseWriteAllowed({
      DIRECT_URL: "postgresql://intercessao:x@127.0.0.1:55433/intercessao_dev",
    })
    expect(target.local).toBe(true)
    expect(target.database).toBe("intercessao_dev")
  })

  it("bloqueia database local não autorizado", () => {
    expect(() =>
      assertDatabaseWriteAllowed({
        DIRECT_URL: "postgresql://intercessao:x@127.0.0.1:55433/postgres",
      }),
    ).toThrow(/lista autorizada/)
  })

  it("bloqueia host remoto sem autorização", () => {
    expect(() =>
      assertDatabaseWriteAllowed({
        DIRECT_URL: "postgresql://user:pass@db.example.com:5432/prod",
      }),
    ).toThrow(/Escrita bloqueada/)
  })

  it("bloqueia VERCEL_ENV=production", () => {
    expect(() =>
      assertDatabaseWriteAllowed({
        VERCEL_ENV: "production",
        DIRECT_URL: "postgresql://intercessao:x@127.0.0.1:55433/intercessao_dev",
      }),
    ).toThrow(/production/)
  })
})

describe("runtime connection resolution", () => {
  it("prioriza RUNTIME_DATABASE_URL local sobre DATABASE_URL_POOLED remoto", () => {
    const resolved = resolveRuntimeDatabaseUrl({
      RUNTIME_DATABASE_URL: "postgresql://u:p@127.0.0.1:51218/intercessao_dev",
      DATABASE_URL_POOLED: "postgresql://u:p@pooled.db.prisma.io/postgres",
      DATABASE_URL: "postgresql://u:p@127.0.0.1:51218/intercessao_dev",
    })
    expect(resolved.name).toBe("RUNTIME_DATABASE_URL")
    expect(resolved.pooled).toBe(false)
  })

  it("na Vercel prefere DATABASE_URL_POOLED", () => {
    const resolved = resolveRuntimeDatabaseUrl({
      VERCEL: "1",
      VERCEL_ENV: "preview",
      DATABASE_URL_POOLED: "postgresql://u:p@pooled.db.prisma.io/postgres",
      DATABASE_URL: "postgresql://u:p@db.prisma.io/postgres",
    })
    expect(resolved.name).toBe("DATABASE_URL_POOLED")
    expect(resolved.pooled).toBe(true)
  })

  it("fora da Vercel recusa usar apenas pooled remoto", () => {
    expect(() =>
      resolveRuntimeDatabaseUrl({
        DATABASE_URL_POOLED: "postgresql://u:p@pooled.db.prisma.io/postgres",
      }),
    ).toThrow(/RUNTIME_DATABASE_URL/)
  })

  it("assertTestRuntimeIsLocal valida host e database", () => {
    const target = assertTestRuntimeIsLocal({
      RUNTIME_DATABASE_URL: "postgresql://u:p@127.0.0.1:51218/intercessao_dev",
    })
    expect(target.local).toBe(true)
    expect(target.database).toBe("intercessao_dev")
  })
})
