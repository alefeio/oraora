import {
  AUTHORIZED_LOCAL_DATABASES,
  parseDatabaseTarget,
  resolveDirectDatabaseUrl,
  resolveRuntimeDatabaseUrl,
} from "@/lib/db/connection"

type EnvLike = Record<string, string | undefined>

export type DeclaredBootstrapEnvironment = "preview" | "local"

export type BootstrapDbFingerprint = {
  declaredEnvironment: DeclaredBootstrapEnvironment
  direct: {
    source: string
    url: string
    host: string
    database: string
    local: boolean
  }
  runtime: {
    source: string
    url: string
    host: string
    database: string
    local: boolean
    connectionName: string
    pooled: boolean
  }
  vercelEnv: string | null
  sameDatabase: boolean
  classification: "local_authorized" | "preview_remote" | "production_blocked" | "mismatch" | "unauthorized"
  allowedForApply: boolean
  reason: string
}

function looksLikeProductionHost(host: string): boolean {
  const h = host.toLowerCase()
  return h.includes("prod") && !h.includes("preview")
}

/**
 * Comprova alinhamento entre ambiente declarado, DIRECT_URL e runtime Prisma.
 * `--env=preview` ou ALLOW_REMOTE_DB_WRITE isolados NÃO bastam.
 */
export function assertBootstrapDbTarget(
  declaredEnvironment: DeclaredBootstrapEnvironment,
  env: EnvLike = process.env,
): BootstrapDbFingerprint {
  if (env.VERCEL_ENV === "production") {
    throw new Error("BOOT-01R: Production (VERCEL_ENV=production) nunca é alvo permitido.")
  }

  const directResolved = resolveDirectDatabaseUrl(env)
  const runtimeResolved = resolveRuntimeDatabaseUrl(env)
  const direct = parseDatabaseTarget(directResolved.url, directResolved.name)
  const runtimeParsed = parseDatabaseTarget(runtimeResolved.url, runtimeResolved.name)

  const fingerprintBase = {
    declaredEnvironment,
    direct: {
      source: direct.source,
      url: "[redacted]",
      host: direct.host,
      database: direct.database,
      local: direct.local,
    },
    runtime: {
      source: runtimeParsed.source,
      url: "[redacted]",
      host: runtimeParsed.host,
      database: runtimeParsed.database,
      local: runtimeParsed.local,
      connectionName: runtimeResolved.name,
      pooled: runtimeResolved.pooled,
    },
    vercelEnv: env.VERCEL_ENV ?? null,
    // Pooled vs direct podem ter hosts diferentes; o database name deve coincidir.
    sameDatabase:
      direct.database === runtimeParsed.database &&
      direct.local === runtimeParsed.local,
  }

  if (looksLikeProductionHost(direct.host) || looksLikeProductionHost(runtimeParsed.host)) {
    throw new Error("BOOT-01R: alvo classificado como Production — operação recusada.")
  }

  let classification: BootstrapDbFingerprint["classification"]
  let allowedForApply = false
  let reason: string

  if (declaredEnvironment === "local") {
    if (!direct.local || !runtimeParsed.local) {
      classification = "mismatch"
      reason = "declared_local_but_host_not_local"
    } else if (
      !AUTHORIZED_LOCAL_DATABASES.has(direct.database) ||
      !AUTHORIZED_LOCAL_DATABASES.has(runtimeParsed.database)
    ) {
      classification = "unauthorized"
      reason = "local_database_not_in_allowlist"
    } else if (direct.database !== runtimeParsed.database) {
      classification = "mismatch"
      reason = "direct_and_runtime_database_diverge"
    } else {
      classification = "local_authorized"
      allowedForApply = true
      reason = "local_authorized_match"
    }
  } else {
    // preview: host não pode ser local; database precisa bater com BOOTSTRAP_PREVIEW_DATABASE
    if (direct.local || runtimeParsed.local) {
      classification = "mismatch"
      reason = "declared_preview_but_host_is_local"
    } else if (direct.database !== runtimeParsed.database) {
      classification = "mismatch"
      reason = "preview_database_names_diverge"
    } else if (env.BOOTSTRAP_PREVIEW_DATABASE !== runtimeParsed.database) {
      classification = "unauthorized"
      reason = "missing_or_mismatch_BOOTSTRAP_PREVIEW_DATABASE"
    } else if (env.ALLOW_REMOTE_DB_WRITE !== "true") {
      classification = "unauthorized"
      reason = "ALLOW_REMOTE_DB_WRITE_required_for_preview_apply"
    } else {
      classification = "preview_remote"
      allowedForApply = true
      reason = "preview_explicitly_identified"
    }
  }

  return {
    ...fingerprintBase,
    classification,
    allowedForApply,
    reason,
  }
}

export function redactBootstrapFingerprint(fp: BootstrapDbFingerprint) {
  return {
    declaredEnvironment: fp.declaredEnvironment,
    vercelEnv: fp.vercelEnv,
    direct: {
      source: fp.direct.source,
      host: fp.direct.host,
      database: fp.direct.database,
      local: fp.direct.local,
    },
    runtime: {
      source: fp.runtime.source,
      host: fp.runtime.host,
      database: fp.runtime.database,
      local: fp.runtime.local,
      connectionName: fp.runtime.connectionName,
      pooled: fp.runtime.pooled,
    },
    sameDatabase: fp.sameDatabase,
    classification: fp.classification,
    allowedForApply: fp.allowedForApply,
    reason: fp.reason,
  }
}
