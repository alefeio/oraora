import { attachDatabasePool } from "@vercel/functions"
import { config as loadEnv } from "dotenv"
import { Pool, type PoolConfig } from "pg"
import { normalizePostgresSslMode, resolveRuntimeDatabaseUrl } from "./connection"

loadEnv({ path: ".env.local", quiet: true })
loadEnv({ path: ".env", quiet: true })

const globalForPool = globalThis as unknown as { intercessaoPgPool?: Pool }

function redactDatabaseMessage(message: string) {
  return message.replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted-url]")
}

function createPool() {
  const onVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV)
  const config: PoolConfig = {
    connectionString: normalizePostgresSslMode(resolveRuntimeDatabaseUrl().url),
    max: onVercel ? 3 : 10,
    idleTimeoutMillis: onVercel ? 5_000 : 30_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: !onVercel,
  }
  const pool = new Pool(config)

  pool.on("error", (error: Error) => {
    const code = "code" in error && typeof error.code === "string" ? error.code : undefined
    console.error("Idle PostgreSQL connection error", {
      name: error.name,
      code,
      message: redactDatabaseMessage(error.message),
    })
  })

  // attachDatabasePool é específico do runtime Vercel; em testes locais atrapalha o ciclo de vida do pool.
  if (onVercel) {
    attachDatabasePool(pool)
  }
  return pool
}

export const pool = globalForPool.intercessaoPgPool ?? createPool()

if (process.env.NODE_ENV !== "production") {
  globalForPool.intercessaoPgPool = pool
}
