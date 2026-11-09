import { parseDatabaseTarget, resolveDirectDatabaseUrl } from "./connection"

type EnvLike = Record<string, string | undefined>

/**
 * Impede migrations/escritas administrativas silenciosas em hosts remotos.
 * Banco local Docker é permitido. Remoto exige ALLOW_REMOTE_DB_WRITE=true.
 */
export function assertDatabaseWriteAllowed(env: EnvLike = process.env) {
  if (env.VERCEL_ENV === "production") {
    throw new Error("Escrita/migration recusada com VERCEL_ENV=production nesta fundação.")
  }

  const target = parseDatabaseTarget(resolveDirectDatabaseUrl(env).url, "direct")
  if (target.local) return target

  if (env.ALLOW_REMOTE_DB_WRITE === "true") return target

  throw new Error(
    `Escrita bloqueada para host não local (${target.host}/${target.database}). Use Postgres isolado ou ALLOW_REMOTE_DB_WRITE=true com autorização explícita.`,
  )
}

export function redactDatabaseTarget(target: ReturnType<typeof parseDatabaseTarget>) {
  return {
    source: target.source,
    host: target.host,
    database: target.database,
    local: target.local,
  }
}
