import { describe, expect, it } from "vitest"
import {
  ABUSE_RATE_LIMITS,
  classifyPrayerSubmission,
  looksNonsensical,
  VALIDATION_POLICY_VERSION,
} from "@/modules/intercession/validation-policy-v2"

describe("validation policy V2 (02R hardening)", () => {
  it("exporta versão 2 e limites configuráveis documentados", () => {
    expect(VALIDATION_POLICY_VERSION).toBe(2)
    expect(ABUSE_RATE_LIMITS.hardMaxSubmissions).toBeGreaterThan(
      ABUSE_RATE_LIMITS.softMaxSubmissions,
    )
  })

  it("aceita oração legítima, curta e significativa, sem versículo e sem jargão religioso", () => {
    expect(
      classifyPrayerSubmission({
        body: "Senhor, cuida desta família com paz e esperança.",
        submissionsInWindow: 0,
        duplicateHashCount: 0,
      }),
    ).toMatchObject({ kind: "decide", outcome: "accepted" })

    expect(
      classifyPrayerSubmission({
        body: "Força e cuidado nesta luta difícil.",
        submissionsInWindow: 0,
        duplicateHashCount: 0,
      }),
    ).toMatchObject({ kind: "decide", outcome: "accepted" })
  })

  it("bloqueia texto vazio e trivial antes da criação", () => {
    expect(
      classifyPrayerSubmission({
        body: "   ",
        submissionsInWindow: 0,
        duplicateHashCount: 0,
      }),
    ).toMatchObject({ kind: "block_before_submit", code: "PRAYER_BODY_REQUIRED" })

    expect(
      classifyPrayerSubmission({
        body: "Amém",
        submissionsInWindow: 0,
        duplicateHashCount: 0,
      }),
    ).toMatchObject({ kind: "block_before_submit", code: "PRAYER_BODY_INSUFFICIENT" })
  })

  it("pede complementação para conteúdo sem significado", () => {
    expect(looksNonsensical("asdfghjkl")).toBe(true)
    expect(
      classifyPrayerSubmission({
        body: "asdf qwer zxcv",
        submissionsInWindow: 0,
        duplicateHashCount: 0,
      }),
    ).toMatchObject({
      kind: "block_before_submit",
      code: "PRAYER_BODY_INSUFFICIENT",
      signals: ["nonsensical_content"],
    })
  })

  it("não confunde relato legítimo de sofrimento com ofensa", () => {
    const result = classifyPrayerSubmission({
      body: "Proteja esta família da violência e traga paz e conforto à vítima.",
      submissionsInWindow: 0,
      duplicateHashCount: 0,
    })
    expect(result).toMatchObject({ kind: "decide", outcome: "accepted" })
  })

  it("encaminha ameaça objetiva à moderação", () => {
    const result = classifyPrayerSubmission({
      body: "Vou te matar se você continuar pedindo isso aqui.",
      submissionsInWindow: 0,
      duplicateHashCount: 0,
    })
    expect(result).toMatchObject({ kind: "decide", outcome: "manual_review" })
    if (result.kind === "decide") {
      expect(result.signals).toContain("threat_language")
    }
  })

  it("não rejeita repetição legítima isolada (sinal fraco)", () => {
    const result = classifyPrayerSubmission({
      body: "Pai, fortalece esta pessoa na saúde e na fé.",
      submissionsInWindow: 1,
      duplicateHashCount: ABUSE_RATE_LIMITS.duplicateHashSoft,
    })
    expect(result).toMatchObject({ kind: "decide", outcome: "accepted" })
    if (result.kind === "decide") {
      expect(result.signals).toContain("duplicate_content")
    }
  })

  it("encaminha padrão abusivo à moderação ou rejeita anúncio claro", () => {
    const spam = classifyPrayerSubmission({
      body: "Compre agora com desconto! https://spam.example https://promo.example",
      submissionsInWindow: ABUSE_RATE_LIMITS.hardMaxSubmissions,
      duplicateHashCount: ABUSE_RATE_LIMITS.duplicateHashHard,
    })
    expect(spam.kind).toBe("decide")
    if (spam.kind === "decide") {
      expect(["manual_review", "rejected"]).toContain(spam.outcome)
    }

    expect(
      classifyPrayerSubmission({
        body: "Compre agora promoção imperdível https://loja.example https://promo.example",
        submissionsInWindow: 0,
        duplicateHashCount: 0,
      }),
    ).toMatchObject({ kind: "decide", outcome: "rejected" })
  })
})
