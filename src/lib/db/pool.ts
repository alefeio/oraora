import { attachDatabasePool } from "@vercel/functions"
import { config as loadEnv } from "dotenv"
import { Pool, type PoolClient, type PoolConfig } from "pg"
import { normalizePostgresSslMode, resolveRuntimeDatabaseUrl } from "./connection"
import {
  LOCAL_CONNECT_RETRY,
  SERVERLESS_CONNECT_RETRY,
  withTransientDbRetry,
} from "./transient"

loadEnv({ path: ".env.local", quiet: true })
loadEnv({ path: ".env", quiet: true })

const globalForPool = globalThis as unknown as { intercessaoPgPool?: Pool }

function redactDatabaseMessage(message: string) {
  return message.replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted-url]")
}

function releaseLateClient(client: PoolClient) {
  try {
    client.release(true)
    console.warn("pool_late_client_released", { reason: "connect_budget_timeout" })
  } catch (error) {
    console.error("pool_late_client_release_failed", {
      name: error instanceof Error ? error.name : "Error",
      message: error instanceof Error ? redactDatabaseMessage(error.message) : "unknown",
    })
  }
}

function installTransientConnectRetry(pool: Pool, onVercel: boolean) {
  const originalConnect = pool.connect.bind(pool)
  const retryOptions = onVercel ? SERVERLESS_CONNECT_RETRY : LOCAL_CONNECT_RETRY

  async function connectWithRetry(): Promise<PoolClient> {
    return withTransientDbRetry(() => originalConnect() as Promise<PoolClient>, {
      ...retryOptions,
      onLateResult: (value) => {
        releaseLateClient(value as PoolClient)
      },
    })
  }

  pool.connect = ((
    callback?: (
      err: Error | undefined,
      client: PoolClient | undefined,
      done: (release?: boolean | Error) => void,
    ) => void,
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
    // Connect curto: cada tentativa cabe em attemptTimeoutMs do retry serverless (3.5s).
    connectionTimeoutMillis: onVercel ? 3_000 : 5_000,
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

  installTransientConnectRetry(pool, onVercel)

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
