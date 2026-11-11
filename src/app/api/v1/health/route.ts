import { ok, failure } from "@/lib/api/http"
import { PRODUCT_DISPLAY_NAME, PRODUCT_NAME_IS_PROVISIONAL } from "@/lib/config/product"
import { pool } from "@/lib/db/pool"
import { isTransientPrismaPostgresError } from "@/lib/db/transient"

export const maxDuration = 30

export async function GET() {
  const timestamp = new Date().toISOString()
  let database: "ok" | "error" = "ok"
  let databaseTransient = false

  try {
    await pool.query("SELECT 1")
  } catch (error) {
    database = "error"
    databaseTransient = isTransientPrismaPostgresError(error)
    console.error("health database check failed", {
      transient: databaseTransient,
      name: error instanceof Error ? error.name : "Error",
    })
  }

  const payload = {
    status: database === "ok" ? ("ok" as const) : ("degraded" as const),
    api: "v1" as const,
    productDisplayName: PRODUCT_DISPLAY_NAME,
    productNameIsProvisional: PRODUCT_NAME_IS_PROVISIONAL,
    database,
    timestamp,
  }

  if (database === "error") {
    return failure(503, "database_unavailable", payload)
  }
  return ok(payload)
}
