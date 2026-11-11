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
  account: "/account",
} as const

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
