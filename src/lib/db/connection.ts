export type DatabaseConnectionName =
  | "DIRECT_URL"
  | "DATABASE_URL"
  | "RUNTIME_DATABASE_URL"
  | "DATABASE_URL_POOLED"
  | "POSTGRES_URL"
  | "PRISMA_DATABASE_URL"

type EnvLike = Record<string, string | undefined>

function read(name: string, env: EnvLike = process.env) {
  const value = env[name]?.trim()
  return value ? value : undefined
}

function firstDefined(names: readonly string[], env: EnvLike = process.env) {
  for (const name of names) {
    const value = read(name, env)
    if (value) return { name: name as DatabaseConnectionName, url: value }
  }
  return null
}

function isVercelRuntime(env: EnvLike = process.env) {
  return Boolean(env.VERCEL || env.VERCEL_ENV)
}

export function resolveDirectDatabaseUrl(env: EnvLike = process.env) {
  // Preferir conexão direta local quando disponível; nunca preferir pooled para migrate.
  const direct = read("DIRECT_URL", env)
  if (direct) {
    return { name: "DIRECT_URL" as const, url: direct }
  }

  const databaseUrl = read("DATABASE_URL", env)
  if (databaseUrl) {
    const target = parseDatabaseTarget(databaseUrl, "DATABASE_URL")
    if (target.local) {
      return { name: "DATABASE_URL" as const, url: databaseUrl }
    }
  }

  // Em ambiente local, bloquear fallback silencioso para hosts remotos da integração.
  if (!isVercelRuntime(env) && databaseUrl) {
    const target = parseDatabaseTarget(databaseUrl, "DATABASE_URL")
    if (!target.local) {
      throw new Error(
        "DATABASE_URL aponta para host remoto e DIRECT_URL local está ausente. Configure DIRECT_URL/DATABASE_URL local para migrations.",
      )
    }
  }

  const resolved = firstDefined(["DATABASE_URL", "POSTGRES_URL", "PRISMA_DATABASE_URL"], env)
  if (!resolved) {
    throw new Error(
      "Nenhuma variável de conexão direta PostgreSQL foi encontrada (DIRECT_URL / DATABASE_URL / POSTGRES_URL).",
    )
  }
  return resolved
}

const relaxedSslModes = new Set(["require", "prefer", "verify-ca"])

export function normalizePostgresSslMode(rawUrl: string) {
  let sslmode: string | null
  try {
    sslmode = new URL(rawUrl).searchParams.get("sslmode")?.toLowerCase() ?? null
  } catch {
    return rawUrl
  }
  if (!sslmode || !relaxedSslModes.has(sslmode)) return rawUrl
  return rawUrl.replace(
    /([?&]sslmode=)(?:require|prefer|verify-ca)(?=&|#|$)/i,
    "$1verify-full",
  )
}

/**
 * Runtime:
 * - Local: RUNTIME_DATABASE_URL / DATABASE_URL local têm prioridade absoluta sobre pooled remoto.
 * - Vercel: DATABASE_URL_POOLED é preferido para o driver serverless.
 */
export function resolveRuntimeDatabaseUrl(env: EnvLike = process.env) {
  const runtime = read("RUNTIME_DATABASE_URL", env)
  if (runtime) {
    return { name: "RUNTIME_DATABASE_URL" as const, url: runtime, pooled: false as const }
  }

  if (isVercelRuntime(env)) {
    const pooled = read("DATABASE_URL_POOLED", env)
    if (pooled) {
      return { name: "DATABASE_URL_POOLED" as const, url: pooled, pooled: true as const }
    }
  }

  const databaseUrl = read("DATABASE_URL", env)
  if (databaseUrl) {
    const target = parseDatabaseTarget(databaseUrl, "DATABASE_URL")
    if (target.local) {
      return { name: "DATABASE_URL" as const, url: databaseUrl, pooled: false as const }
    }
  }

  // Fora da Vercel, nunca escolher pooled remoto automaticamente.
  if (!isVercelRuntime(env)) {
    throw new Error(
      "Runtime local exige RUNTIME_DATABASE_URL ou DATABASE_URL apontando para Postgres local. DATABASE_URL_POOLED remoto não é usado fora da Vercel.",
    )
  }

  const pooled = read("DATABASE_URL_POOLED", env)
  if (pooled) {
    return { name: "DATABASE_URL_POOLED" as const, url: pooled, pooled: true as const }
  }

  const fallback = firstDefined(["DATABASE_URL", "POSTGRES_URL", "PRISMA_DATABASE_URL", "DIRECT_URL"], env)
  if (!fallback) {
    throw new Error(
      "Nenhuma variável de conexão PostgreSQL de runtime foi encontrada (RUNTIME_DATABASE_URL / DATABASE_URL_POOLED / DATABASE_URL).",
    )
  }
  return { ...fallback, pooled: false as const }
}

export function parseDatabaseTarget(url: string, source: string) {
  const parsed = new URL(url)
  const host = parsed.hostname.toLowerCase()
  const database = parsed.pathname.replace(/^\//, "") || "(default)"
  const local =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.endsWith(".local")
  return { source, url, host, database, local }
}

/** Nomes de banco locais autorizados para escrita de testes/seeds/migrations. */
export const AUTHORIZED_LOCAL_DATABASES = new Set(["intercessao_dev", "intercessao_test"])
