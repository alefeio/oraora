import {
  AUTHORIZED_LOCAL_DATABASES,
  parseDatabaseTarget,
  resolveDirectDatabaseUrl,
  resolveRuntimeDatabaseUrl,
} from "./connection"

type EnvLike = Record<string, string | undefined>

/**
 * Impede migrations/escritas administrativas silenciosas em hosts remotos.
 * Exige host local E database autorizado (intercessao_dev|intercessao_test),
 * a menos que ALLOW_REMOTE_DB_WRITE=true com autorização explícita.
 */
export function assertDatabaseWriteAllowed(env: EnvLike = process.env) {
  if (env.VERCEL_ENV === "production") {
    throw new Error("Escrita/migration recusada com VERCEL_ENV=production nesta fundação.")
  }

  const target = parseDatabaseTarget(resolveDirectDatabaseUrl(env).url, "direct")
  if (target.local) {
    if (!AUTHORIZED_LOCAL_DATABASES.has(target.database)) {
      throw new Error(
        `Escrita bloqueada: database local '${target.database}' não está na lista autorizada (intercessao_dev|intercessao_test).`,
      )
    }
    return target
  }

  if (env.ALLOW_REMOTE_DB_WRITE === "true") return target

  throw new Error(
    `Escrita bloqueada para host não local (${target.host}/${target.database}). Use Postgres isolado ou ALLOW_REMOTE_DB_WRITE=true com autorização explícita.`,
  )
}

/** Garante que o runtime de testes não aponta para pooled/remoto. */
export function assertTestRuntimeIsLocal(env: EnvLike = process.env) {
  const runtime = resolveRuntimeDatabaseUrl(env)
  const target = parseDatabaseTarget(runtime.url, runtime.name)
  if (!target.local) {
    throw new Error(
      `Runtime de teste aponta para host remoto (${target.host}). Configure RUNTIME_DATABASE_URL local.`,
    )
  }
  if (!AUTHORIZED_LOCAL_DATABASES.has(target.database)) {
    throw new Error(
      `Runtime de teste usa database '${target.database}', esperado intercessao_dev ou intercessao_test.`,
    )
  }
  return { ...target, connectionName: runtime.name, pooled: runtime.pooled }
}

export function redactDatabaseTarget(target: ReturnType<typeof parseDatabaseTarget>) {
  return {
    source: target.source,
    host: target.host,
    database: target.database,
    local: target.local,
  }
}
