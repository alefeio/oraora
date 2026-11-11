import { describe, expect, it } from "vitest"
import {
  PRODUCT_DISPLAY_NAME,
  PRODUCT_ESSENCE,
  PRODUCT_PRINCIPLE,
  PRODUCT_STATUS,
  PRODUCT_TAGLINE,
  SITE_URL,
} from "@/lib/brand"

describe("PROD-0 brand copy", () => {
  it("mantém identidade oficial", () => {
    expect(PRODUCT_DISPLAY_NAME).toBe("Ora Ora")
    expect(PRODUCT_TAGLINE).toBe("Pessoas que oram umas pelas outras.")
    expect(PRODUCT_ESSENCE).toContain("fé aproxima")
    expect(PRODUCT_PRINCIPLE).toContain("Antes de pedir")
    expect(PRODUCT_STATUS.toLowerCase()).toContain("preparação")
    expect(SITE_URL).toBe("https://oraora.ia.br")
  })

  it("não inclui promessas milagrosas nem linguagem de pagamento por oração", () => {
    const blob = [
      PRODUCT_DISPLAY_NAME,
      PRODUCT_TAGLINE,
      PRODUCT_ESSENCE,
      PRODUCT_PRINCIPLE,
      PRODUCT_STATUS,
    ]
      .join(" ")
      .toLowerCase()
    expect(blob).not.toMatch(/milagre garantido|pague por oração|doe para orar/)
  })
})
