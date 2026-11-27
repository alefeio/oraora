import { describe, expect, it } from "vitest"
import {
  ABUSE_RATE_LIMITS,
  classifyPrayerSubmission,
  VALIDATION_POLICY_VERSION,
} from "@/modules/intercession/validation-policy-v2"

describe("validation policy V2", () => {
  it("exporta versão 2 e limites configuráveis documentados", () => {
    expect(VALIDATION_POLICY_VERSION).toBe(2)
    expect(ABUSE_RATE_LIMITS.hardMaxSubmissions).toBeGreaterThan(
      ABUSE_RATE_LIMITS.softMaxSubmissions,
    )
  })

  it("aceita oração legítima, curta e significativa, sem versículo", () => {
    const result = classifyPrayerSubmission({
      body: "Senhor, cuida desta família com paz e esperança.",
      submissionsInWindow: 0,
      duplicateHashCount: 0,
    })
    expect(result).toMatchObject({ kind: "decide", outcome: "accepted" })
  })

  it("bloqueia texto vazio antes da criação", () => {
    const result = classifyPrayerSubmission({
      body: "   ",
      submissionsInWindow: 0,
      duplicateHashCount: 0,
    })
    expect(result).toMatchObject({
      kind: "block_before_submit",
      code: "PRAYER_BODY_REQUIRED",
    })
  })

  it("pede complementação para mensagem trivial", () => {
    const result = classifyPrayerSubmission({
      body: "Amém",
      submissionsInWindow: 0,
      duplicateHashCount: 0,
    })
    expect(result).toMatchObject({
      kind: "block_before_submit",
      code: "PRAYER_BODY_INSUFFICIENT",
    })
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

  it("encaminha padrão abusivo à moderação", () => {
    const result = classifyPrayerSubmission({
      body: "Compre agora com desconto! https://spam.example https://promo.example",
      submissionsInWindow: ABUSE_RATE_LIMITS.hardMaxSubmissions,
      duplicateHashCount: ABUSE_RATE_LIMITS.duplicateHashHard,
    })
    expect(result.kind).toBe("decide")
    if (result.kind === "decide") {
      expect(["manual_review", "rejected"]).toContain(result.outcome)
    }
  })

  it("rejeita anúncio inequívoco sem linguagem de oração", () => {
    const result = classifyPrayerSubmission({
      body: "Compre agora promoção imperdível https://loja.example https://promo.example",
      submissionsInWindow: 0,
      duplicateHashCount: 0,
    })
    expect(result).toMatchObject({ kind: "decide", outcome: "rejected" })
  })
})
