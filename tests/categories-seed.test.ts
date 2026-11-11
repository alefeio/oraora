import { describe, expect, it } from "vitest"
import {
  INITIAL_CATEGORIES,
  categorySeedFingerprint,
} from "@/modules/prayer-requests/categories"

describe("category seed catalog", () => {
  it("contém as 11 categorias iniciais com slugs únicos", () => {
    expect(INITIAL_CATEGORIES).toHaveLength(11)
    const slugs = INITIAL_CATEGORIES.map((item) => item.slug)
    expect(new Set(slugs).size).toBe(11)
    expect(slugs).toContain("saude")
    expect(slugs).toContain("outros")
  })

  it("fingerprint estável para seed idempotente", () => {
    expect(categorySeedFingerprint()).toBe(categorySeedFingerprint())
  })
})
