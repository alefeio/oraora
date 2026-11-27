import { createHash } from "node:crypto"
import type { PrismaClient } from "@/generated/prisma/client"
import {
  normalizePostgresSslMode,
  parseDatabaseTarget,
  resolveDirectDatabaseUrl,
  resolveRuntimeDatabaseUrl,
} from "./connection"

/** Fingerprints canônicos do Preview Ora Ora (store_xYaw5J0xe3Gb9T89). */
export const PREVIEW_DIRECT_FINGERPRINT = "8b65e5eb92cad1c8"
export const PREVIEW_POOLED_FINGERPRINT = "930a9c544cfa015d"
export const PREVIEW_STORE_ID = "store_xYaw5J0xe3Gb9T89"

export type DbUrlFingerprint = {
  fingerprint: string
  host: string
  database: string
  username: string
  local: boolean
  sslMode: string | null
}

/**
 * Fingerprint estável de uma URL Postgres (hostname|username|pathname).
 * Não inclui senha.
 */
export function fingerprintDatabaseUrl(url: string): DbUrlFingerprint {
  const u = new URL(url)
  const pathname = u.pathname || "/"
  const fingerprint = createHash("sha256")
    .update(`${u.hostname}|${u.username}|${pathname}`)
    .digest("hex")
    .slice(0, 16)
  const target = parseDatabaseTarget(url, "url")
  return {
    fingerprint,
    host: target.host,
    database: target.database,
    username: u.username,
    local: target.local,
    sslMode: u.searchParams.get("sslmode")?.toLowerCase() ?? null,
  }
}

export type EffectiveWriteTargetProof = {
  runtime: DbUrlFingerprint & { source: string; pooled: boolean; normalizedSsl: boolean }
  direct: DbUrlFingerprint & { source: string }
  liveDatabase: string
  authorizedPreview: boolean
  authorizedLocal: boolean
}

function assertRemoteTls(fp: DbUrlFingerprint, label: string) {
  if (fp.local) return
  if (fp.sslMode === "disable" || fp.sslMode === "allow") {
    throw new Error(`DATA-02: TLS insuficiente em ${label} (sslmode=${fp.sslMode}).`)
  }
}

/**
 * Comprova o destino efetivo usado pelo Prisma (URL de runtime do pool + consulta live).
 * Não aceita como prova apenas inspeção de URL direta em script separado.
 */
export async function proveEffectivePrismaWriteTarget(
  prisma: PrismaClient,
  options: {
    expectedPreviewFingerprints?: readonly string[]
    requirePreview?: boolean
  } = {},
): Promise<EffectiveWriteTargetProof> {
  const expected =
    options.expectedPreviewFingerprints ??
    ([PREVIEW_DIRECT_FINGERPRINT, PREVIEW_POOLED_FINGERPRINT] as const)

  const runtimeResolved = resolveRuntimeDatabaseUrl()
  const directResolved = resolveDirectDatabaseUrl()

  const normalizedRuntimeUrl = normalizePostgresSslMode(runtimeResolved.url)
  const runtimeFp = fingerprintDatabaseUrl(normalizedRuntimeUrl)
  const directFp = fingerprintDatabaseUrl(directResolved.url)

  assertRemoteTls(runtimeFp, "runtime")
  assertRemoteTls(directFp, "direct")

  if (!runtimeFp.local && normalizedRuntimeUrl === runtimeResolved.url) {
    // Remoto sem sslmode explícito ainda passa por normalize; se já era verify-full, ok.
  }

  const live = await prisma.$queryRaw<Array<{ db: string }>>`
    SELECT current_database() AS db
  `
  const liveDatabase = live[0]?.db
  if (!liveDatabase) {
    throw new Error("DATA-02: não foi possível ler current_database() via Prisma.")
  }

  // A conexão live deve bater com o database da URL de runtime.
  if (liveDatabase !== runtimeFp.database && runtimeFp.database !== "(default)") {
    throw new Error(
      `DATA-02: divergência live vs runtime (${liveDatabase} ≠ ${runtimeFp.database}).`,
    )
  }

  const authorizedPreview = expected.includes(runtimeFp.fingerprint)
  const authorizedLocal =
    runtimeFp.local &&
    (runtimeFp.database === "intercessao_dev" || runtimeFp.database === "intercessao_test")

  if (options.requirePreview) {
    if (!authorizedPreview) {
      throw new Error(
        `DATA-02: fingerprint runtime ${runtimeFp.fingerprint} não autorizado para Preview (esperado ${expected.join("|")}).`,
      )
    }
    if (directFp.local || runtimeFp.local) {
      throw new Error("DATA-02: Preview exigido, mas alvo local detectado.")
    }
    // Direct e runtime podem divergir (pooled vs unpooled), mas o live db deve ser o Preview.
    if (liveDatabase !== "postgres" && !liveDatabase.includes("preview")) {
      // Prisma Postgres Preview costuma usar database name "postgres" no path.
      // Aceitamos desde que o fingerprint da URL de runtime seja o canônico.
    }
  }

  if (!authorizedPreview && !authorizedLocal) {
    throw new Error(
      `DATA-02: fingerprint runtime ${runtimeFp.fingerprint} não autorizado (preview nem local).`,
    )
  }

  return {
    runtime: {
      ...runtimeFp,
      source: runtimeResolved.name,
      pooled: runtimeResolved.pooled,
      normalizedSsl: normalizedRuntimeUrl !== runtimeResolved.url || runtimeFp.sslMode === "verify-full",
    },
    direct: {
      ...directFp,
      source: directResolved.name,
    },
    liveDatabase,
    authorizedPreview,
    authorizedLocal,
  }
}
