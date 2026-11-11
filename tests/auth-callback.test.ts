import { describe, expect, it } from "vitest"
import {
  AUTH_PATHS,
  isSafeAuthCallbackPath,
  resolveSafeAuthCallbackPath,
} from "@/lib/auth/safe-callback"
import {
  PASSWORD_RESET_REQUEST_ACK,
  validateNewPassword,
  validatePasswordConfirmation,
} from "@/lib/auth/password-form"
import { RESET_TOKEN_EXPIRES_IN_SECONDS } from "@/lib/auth/policy"

describe("safe auth callbacks", () => {
  it("aceita apenas caminhos relativos internos", () => {
    expect(isSafeAuthCallbackPath("/email-verificado")).toBe(true)
    expect(isSafeAuthCallbackPath("/redefinir-senha?token=abc")).toBe(true)
    expect(isSafeAuthCallbackPath("https://evil.example/phish")).toBe(false)
    expect(isSafeAuthCallbackPath("//evil.example")).toBe(false)
    expect(isSafeAuthCallbackPath("javascript:alert(1)")).toBe(false)
    expect(isSafeAuthCallbackPath("/\\evil")).toBe(false)
  })

  it("cai no fallback seguro", () => {
    expect(resolveSafeAuthCallbackPath("https://evil.example", AUTH_PATHS.login)).toBe(
      AUTH_PATHS.login,
    )
    expect(resolveSafeAuthCallbackPath("/confirme-seu-email")).toBe("/confirme-seu-email")
  })
})

describe("password recovery form validation", () => {
  it("rejeita senha curta", () => {
    expect(validateNewPassword("curta")).toMatch(/pelo menos/)
  })

  it("rejeita confirmação divergente", () => {
    expect(validatePasswordConfirmation("senha-valida-123", "outra-senha-123")).toMatch(
      /não coincide/,
    )
  })

  it("aceita senha válida com confirmação igual", () => {
    expect(validateNewPassword("senha-valida-123")).toBeNull()
    expect(validatePasswordConfirmation("senha-valida-123", "senha-valida-123")).toBeNull()
  })

  it("mantém mensagem neutra de solicitação", () => {
    expect(PASSWORD_RESET_REQUEST_ACK.toLowerCase()).toContain("se houver uma conta")
  })

  it("documenta expiração de token de reset", () => {
    expect(RESET_TOKEN_EXPIRES_IN_SECONDS).toBe(60 * 60)
  })
})

describe("auth recovery UX contracts", () => {
  it("usa rotas canônicas locais (não hosts de deployment)", () => {
    expect(AUTH_PATHS.forgotPassword).toBe("/esqueci-minha-senha")
    expect(AUTH_PATHS.resetPassword).toBe("/redefinir-senha")
    expect(AUTH_PATHS.confirmEmail).toBe("/confirme-seu-email")
    expect(AUTH_PATHS.emailVerified).toBe("/email-verificado")
  })
})
