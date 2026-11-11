import { attachDatabasePool } from "@vercel/functions"
import { config as loadEnv } from "dotenv"
import { Pool, type PoolClient, type PoolConfig } from "pg"
import { normalizePostgresSslMode, resolveRuntimeDatabaseUrl } from "./connection"
import { withTransientDbRetry } from "./transient"

loadEnv({ path: ".env.local", quiet: true })
loadEnv({ path: ".env", quiet: true })

const globalForPool = globalThis as unknown as { intercessaoPgPool?: Pool }

function redactDatabaseMessage(message: string) {
  return message.replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted-url]")
}

function installTransientConnectRetry(pool: Pool) {
  const originalConnect = pool.connect.bind(pool)

  async function connectWithRetry(): Promise<PoolClient> {
    return withTransientDbRetry(() => originalConnect())
  }

  pool.connect = ((
    callback?: (err: Error | undefined, client: PoolClient | undefined, done: (release?: boolean | Error) => void) => void,
  ) => {
    if (typeof callback === "function") {
      void connectWithRetry()
        .then((client) => {
          callback(undefined, client, (release?) => {
            client.release(release)
          })
        })
        .catch((error: Error) => {
          callback(error, undefined, () => undefined)
        })
      return
    }

    return connectWithRetry()
  }) as typeof pool.connect
}

function createPool() {
  const onVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV)
  const config: PoolConfig = {
    connectionString: normalizePostgresSslMode(resolveRuntimeDatabaseUrl().url),
    // Serverless: poucas conexões; idle curto evita soquetes mortos após idle-close do Prisma Postgres.
    max: onVercel ? 3 : 10,
    idleTimeoutMillis: onVercel ? 1_000 : 30_000,
    // Upstream frio no pooled costuma falhar ~10s; orçamento um pouco maior + retry em withTransientDbRetry.
    connectionTimeoutMillis: onVercel ? 15_000 : 10_000,
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

  installTransientConnectRetry(pool)

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
