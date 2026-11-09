const directCandidates = [
  "DIRECT_URL",
  "DATABASE_URL",
  "POSTGRES_URL",
  "PRISMA_DATABASE_URL",
] as const

const runtimeCandidates = [
  "RUNTIME_DATABASE_URL",
  "DATABASE_URL",
  "POSTGRES_URL",
  "PRISMA_DATABASE_URL",
  "DIRECT_URL",
] as const

export type DatabaseConnectionName =
  | (typeof directCandidates)[number]
  | (typeof runtimeCandidates)[number]
  | "DATABASE_URL_POOLED"

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

export function resolveDirectDatabaseUrl(env: EnvLike = process.env) {
  const resolved = firstDefined(directCandidates, env)
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

export function resolveRuntimeDatabaseUrl(env: EnvLike = process.env) {
  const pooled = read("DATABASE_URL_POOLED", env)
  if (pooled) {
    return { name: "DATABASE_URL_POOLED" as const, url: pooled, pooled: true as const }
  }

  const resolved = firstDefined(runtimeCandidates, env)
  if (!resolved) {
    throw new Error(
      "Nenhuma variável de conexão PostgreSQL de runtime foi encontrada (RUNTIME_DATABASE_URL / DATABASE_URL).",
    )
  }

  return { ...resolved, pooled: false as const }
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
