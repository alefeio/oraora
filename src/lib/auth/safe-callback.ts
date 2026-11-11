/**
 * Callbacks/redirects de autenticação: apenas caminhos relativos internos.
 * Bloqueia URLs absolutas e esquemas externos (open redirect).
 */
export const AUTH_PATHS = {
  login: "/login",
  signup: "/signup",
  forgotPassword: "/esqueci-minha-senha",
  resetPassword: "/redefinir-senha",
  confirmEmail: "/confirme-seu-email",
  emailVerified: "/email-verificado",
  /** Callback de sucesso do Better Auth — exige marcador explícito, não só ausência de error. */
  emailVerifiedSuccess: "/email-verificado?status=success",
  account: "/account",
} as const

export type EmailVerificationPageState = "success" | "error" | "pending"

/**
 * Estado da página /email-verificado.
 * Ausência de `error` sozinha NÃO prova verificação — exige `status=success` (ou equivalente).
 */
export function resolveEmailVerificationPageState(params: {
  error?: string | null
  status?: string | null
  verified?: string | null
}): EmailVerificationPageState {
  if (params.error && params.error.trim()) return "error"
  const status = params.status?.trim().toLowerCase()
  const verified = params.verified?.trim().toLowerCase()
  if (status === "success" || verified === "1" || verified === "true") return "success"
  return "pending"
}

const RELATIVE_PATH = /^\/[A-Za-z0-9\-._~!$&'()*+,;=:@/%?#[\]]*$/

export function isSafeAuthCallbackPath(value: string | null | undefined): boolean {
  if (!value) return false
  const trimmed = value.trim()
  if (!trimmed.startsWith("/")) return false
  if (trimmed.startsWith("//")) return false
  if (trimmed.includes("\\")) return false
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return false
  return RELATIVE_PATH.test(trimmed)
}

export function resolveSafeAuthCallbackPath(
  value: string | null | undefined,
  fallback: string = AUTH_PATHS.login,
): string {
  if (isSafeAuthCallbackPath(value)) return value!.trim()
  if (isSafeAuthCallbackPath(fallback)) return fallback
  return AUTH_PATHS.login
}

/** Monta redirectTo relativo ao ambiente atual (Preview/local) sem hardcodar host. */
export function authRedirectPath(path: string): string {
  return resolveSafeAuthCallbackPath(path, AUTH_PATHS.login)
}
