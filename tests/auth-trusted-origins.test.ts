import { describe, expect, it } from "vitest"
import {
  ORAORA_VERCEL_PREVIEW_ORIGIN_WILDCARD,
  getAuthBaseURL,
  isTrustedAuthOrigin,
  normalizeOriginUrl,
  resolveTrustedOrigins,
} from "@/lib/auth/trusted-origins"

/** Alias git reportado no Preview (≠ VERCEL_URL de deployment). */
const BRANCH_ALIAS =
  "https://oraora-git-hardening-gate-2-6d-account-b52bb2-alefeios-projects.vercel.app"
const DEPLOYMENT_HOST = "oraora-abc123xyz-alefeios-projects.vercel.app"

describe("normalizeOriginUrl", () => {
  it("normaliza host sem protocolo e remove barra final", () => {
    expect(normalizeOriginUrl("example.com/")).toBe("https://example.com")
    expect(normalizeOriginUrl("https://Example.com/path")).toBe("https://example.com")
  })

  it("rejeita valores inválidos", () => {
    expect(normalizeOriginUrl("")).toBeNull()
    expect(normalizeOriginUrl("not a host")).toBeNull()
  })
})

describe("getAuthBaseURL Preview vs Production", () => {
  it("em Preview prioriza VERCEL_BRANCH_URL sobre BETTER_AUTH_URL de outro host", () => {
    expect(
      getAuthBaseURL({
        VERCEL_ENV: "preview",
        BETTER_AUTH_URL: "https://oraora.ia.br",
        VERCEL_BRANCH_URL: BRANCH_ALIAS.replace("https://", ""),
        VERCEL_URL: DEPLOYMENT_HOST,
      }),
    ).toBe(BRANCH_ALIAS)
  })

  it("em Preview usa VERCEL_URL se não houver branch URL", () => {
    expect(
      getAuthBaseURL({
        VERCEL_ENV: "preview",
        BETTER_AUTH_URL: "https://oraora.ia.br",
        VERCEL_URL: DEPLOYMENT_HOST,
      }),
    ).toBe(`https://${DEPLOYMENT_HOST}`)
  })

  it("em Production preserva BETTER_AUTH_URL / NEXT_PUBLIC_APP_URL", () => {
    expect(
      getAuthBaseURL({
        VERCEL_ENV: "production",
        BETTER_AUTH_URL: "https://oraora.ia.br",
        VERCEL_URL: "should-not-win.vercel.app",
      }),
    ).toBe("https://oraora.ia.br")

    expect(
      getAuthBaseURL({
        VERCEL_ENV: "production",
        NEXT_PUBLIC_APP_URL: "https://oraora.ia.br/",
      }),
    ).toBe("https://oraora.ia.br")
  })
})

describe("resolveTrustedOrigins / Invalid origin Preview", () => {
  const previewEnv = {
    VERCEL_ENV: "preview",
    BETTER_AUTH_URL: "https://oraora.ia.br",
    NEXT_PUBLIC_APP_URL: "https://oraora.ia.br",
    VERCEL_URL: DEPLOYMENT_HOST,
    VERCEL_BRANCH_URL: BRANCH_ALIAS.replace("https://", ""),
  }

  it("inclui alias de branch, deployment e wildcard do projeto", () => {
    const origins = resolveTrustedOrigins(previewEnv)
    expect(origins).toContain(BRANCH_ALIAS)
    expect(origins).toContain(`https://${DEPLOYMENT_HOST}`)
    expect(origins).toContain(ORAORA_VERCEL_PREVIEW_ORIGIN_WILDCARD)
  })

  it("ACEITA a origem do navegador no alias git (caso Invalid origin)", () => {
    expect(isTrustedAuthOrigin(BRANCH_ALIAS, previewEnv)).toBe(true)
  })

  it("ACEITA VERCEL_URL de deployment", () => {
    expect(isTrustedAuthOrigin(`https://${DEPLOYMENT_HOST}`, previewEnv)).toBe(true)
  })

  it("REJEITA origens arbitrárias", () => {
    expect(isTrustedAuthOrigin("https://evil.example", previewEnv)).toBe(false)
    expect(
      isTrustedAuthOrigin("https://other-app-xxx-alefeios-projects.vercel.app", previewEnv),
    ).toBe(false)
    expect(isTrustedAuthOrigin("https://attacker.vercel.app", previewEnv)).toBe(false)
  })

  it("em Production NÃO libera wildcard de Preview", () => {
    const prod = {
      VERCEL_ENV: "production",
      BETTER_AUTH_URL: "https://oraora.ia.br",
      NEXT_PUBLIC_APP_URL: "https://oraora.ia.br",
    }
    const origins = resolveTrustedOrigins(prod)
    expect(origins).not.toContain(ORAORA_VERCEL_PREVIEW_ORIGIN_WILDCARD)
    expect(isTrustedAuthOrigin(BRANCH_ALIAS, prod)).toBe(false)
    expect(isTrustedAuthOrigin("https://oraora.ia.br", prod)).toBe(true)
  })
})
