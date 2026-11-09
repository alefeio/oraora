import { describe, expect, it } from "vitest"
import {
  isAdminRole,
  requireEmailVerificationEnabled,
  roleForNewUser,
  USER_ROLES,
} from "@/lib/auth/policy"
import { WALLET_LEDGER_DIRECTIVE } from "@/modules/wallet"
import { NO_SPIRITUAL_RANKING } from "@/modules/reputation"

describe("auth policy", () => {
  it("força role USER no cadastro", () => {
    expect(roleForNewUser("ADMIN")).toBe(USER_ROLES.user)
    expect(roleForNewUser(undefined)).toBe(USER_ROLES.user)
  })

  it("reconhece admin apenas pelo papel interno", () => {
    expect(isAdminRole("ADMIN")).toBe(true)
    expect(isAdminRole("USER")).toBe(false)
  })

  it("exige verificação de e-mail em produção por padrão", () => {
    expect(requireEmailVerificationEnabled({ NODE_ENV: "production" })).toBe(true)
    expect(
      requireEmailVerificationEnabled({
        NODE_ENV: "development",
        AUTH_REQUIRE_EMAIL_VERIFICATION: "false",
      }),
    ).toBe(false)
  })
})

describe("domain directives", () => {
  it("mantém diretriz de ledger e ausência de ranking espiritual", () => {
    expect(WALLET_LEDGER_DIRECTIVE).toMatch(/ledger/i)
    expect(NO_SPIRITUAL_RANKING).toBe(true)
  })
})
