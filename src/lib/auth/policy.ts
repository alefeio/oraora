import { isHostedRuntime } from "@/lib/auth/email-transport"

export const USER_ROLES = {
  user: "USER",
  admin: "ADMIN",
} as const

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]

const HOUR_SECONDS = 60 * 60
const WEEK_SECONDS = 7 * 24 * HOUR_SECONDS

export const SESSION_EXPIRES_IN_SECONDS = WEEK_SECONDS
export const RESET_TOKEN_EXPIRES_IN_SECONDS = HOUR_SECONDS
export const MIN_PASSWORD_LENGTH = 10
export const MAX_PASSWORD_LENGTH = 128

export const SESSION_COOKIE_ATTRIBUTES = {
  httpOnly: true,
  sameSite: "lax" as const,
}

export function secureSessionCookies(baseURL: string): boolean {
  return baseURL.startsWith("https://")
}

/** Cadastro nunca aceita role enviada pelo navegador. */
export function roleForNewUser(_requested?: unknown): typeof USER_ROLES.user {
  void _requested
  return USER_ROLES.user
}

export function isAdminRole(role: string | null | undefined): boolean {
  return role === USER_ROLES.admin
}

/**
 * Verificação de e-mail:
 * - Vercel/hospedado: sempre exigida (não contornar ausência de provedor).
 * - Local: AUTH_REQUIRE_EMAIL_VERIFICATION controla; default false só em development.
 */
export function requireEmailVerificationEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (isHostedRuntime(env)) return true
  const raw = env.AUTH_REQUIRE_EMAIL_VERIFICATION?.trim().toLowerCase()
  if (raw === "true") return true
  if (raw === "false") return false
  return env.NODE_ENV === "production"
}
