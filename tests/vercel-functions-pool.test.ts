import { afterEach, describe, expect, it, vi } from "vitest"
import { Pool } from "pg"
import { attachDatabasePool } from "@vercel/functions"

/**
 * SEC-03a — regressão vercel/vercel#17830:
 * em @vercel/functions >=3.11.3, attachDatabasePool lê Date.now()
 * em todo pool.connect(), quebrando prerender com Cache Components.
 * 3.10.6 (escolhida) não deve ler o relógio no checkout.
 */
describe("attachDatabasePool + Cache Components clock safety", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("não lê Date.now() ao fazer connect() após attachDatabasePool (3.10.6)", async () => {
    const pool = new Pool({
      connectionString: "postgresql://127.0.0.1:1/sec03a_probe",
      connectionTimeoutMillis: 50,
      max: 1,
    })
    attachDatabasePool(pool)

    const now = vi.spyOn(Date, "now")
    await pool.connect().catch(() => null)

    expect(now).not.toHaveBeenCalled()
    await pool.end().catch(() => undefined)
  })
})
