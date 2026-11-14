/**
 * Origens confiáveis do Better Auth (CSRF / Origin).
 * Preview Vercel usa alias de branch distinto de VERCEL_URL (deployment) —
 * ambos precisam ser aceitos sem liberar origens arbitrárias.
 */

const TRAILING_SLASH = /\/$/

/** Prefixo estável do projeto no time Vercel (não aceitar *.vercel.app genérico). */
export const ORAORA_VERCEL_PREVIEW_HOST_PATTERN =
  /^oraora-[a-z0-9-]+\.alefeios-projects\.vercel\.app$/i

/** Wildcard Better Auth limitado ao projeto Ora Ora no team. */
export const ORAORA_VERCEL_PREVIEW_ORIGIN_WILDCARD =
  "https://oraora-*-alefeios-projects.vercel.app"

function stripProtocol(hostOrUrl: string): string {
  return hostOrUrl.replace(/^https?:\/\//i, "").replace(TRAILING_SLASH, "")
}

export function normalizeOriginUrl(value: string | undefined | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed)
      if (url.protocol !== "http:" && url.protocol !== "https:") return null
      return `${url.protocol}//${url.host}`
    } catch {
      return null
    }
  }
  const host = stripProtocol(trimmed)
  if (!host || host.includes("/") || host.includes(" ")) return null
  return `https://${host}`
}

export function isOraoraVercelPreviewOrigin(origin: string): boolean {
  try {
    const url = new URL(origin)
    if (url.protocol !== "https:") return false
    return ORAORA_VERCEL_PREVIEW_HOST_PATTERN.test(url.host)
  } catch {
    return false
  }
}

/**
 * baseURL usado em links de e-mail (verify/reset).
 * Em Preview, prioriza VERCEL_BRANCH_URL / VERCEL_URL para o link coincidir
 * com o ambiente em que o usuário está — não Production.
 */
export function getAuthBaseURL(env: Record<string, string | undefined> = process.env): string {
  if (env.VERCEL_ENV === "preview") {
    const branch = normalizeOriginUrl(env.VERCEL_BRANCH_URL)
    if (branch) return branch
    const deployment = normalizeOriginUrl(env.VERCEL_URL)
    if (deployment) return deployment
  }

  const configured = normalizeOriginUrl(env.BETTER_AUTH_URL)
  if (configured) return configured

  if (env.VERCEL_ENV === "production") {
    const app = normalizeOriginUrl(env.NEXT_PUBLIC_APP_URL)
    if (app) return app
  }

  const vercel = normalizeOriginUrl(env.VERCEL_URL)
  if (vercel) return vercel

  return "http://localhost:3000"
}

/**
 * Lista estática + padrões. Em Preview inclui wildcard do projeto.
 * Em Production NÃO inclui wildcard — só URLs explícitas.
 */
export function resolveTrustedOrigins(
  env: Record<string, string | undefined> = process.env,
): string[] {
  const origins = new Set<string>()

  const add = (value: string | null | undefined) => {
    const normalized = normalizeOriginUrl(value)
    if (normalized) origins.add(normalized)
  }

  add(getAuthBaseURL(env))
  add(env.BETTER_AUTH_URL)
  add(env.NEXT_PUBLIC_APP_URL)
  add(env.VERCEL_URL)
  add(env.VERCEL_BRANCH_URL)
  add(env.VERCEL_PROJECT_PRODUCTION_URL)

  if (env.VERCEL_ENV === "preview" || (!env.VERCEL_ENV && env.NODE_ENV !== "production")) {
    // Alias git / deployment do projeto no team — não *.vercel.app aberto.
    origins.add(ORAORA_VERCEL_PREVIEW_ORIGIN_WILDCARD)
  }

  if (!env.VERCEL_ENV && env.NODE_ENV !== "production") {
    origins.add("http://localhost:3000")
    origins.add("http://127.0.0.1:3000")
  }

  return [...origins]
}

/** Test helper: origem exata ou match do wildcard de Preview do projeto. */
export function isTrustedAuthOrigin(
  origin: string,
  env: Record<string, string | undefined> = process.env,
): boolean {
  const trusted = resolveTrustedOrigins(env)
  let parsed: URL
  try {
    parsed = new URL(origin)
  } catch {
    return false
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false
  const canonical = `${parsed.protocol}//${parsed.host}`

  for (const entry of trusted) {
    if (entry === canonical) return true
    if (entry === ORAORA_VERCEL_PREVIEW_ORIGIN_WILDCARD) {
      if (env.VERCEL_ENV === "production") continue
      if (isOraoraVercelPreviewOrigin(canonical)) return true
    }
  }
  return false
}
