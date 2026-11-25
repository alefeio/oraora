import { describe, expect, it } from "vitest"
import { categoriesFromPrimaryFeed } from "@/modules/prayer-requests/public-dto"
import type { PublicPrayerRequestDto } from "@/modules/prayer-requests/types"

function request(
  partial: Partial<PublicPrayerRequestDto> & {
    id: string
    category: PublicPrayerRequestDto["category"]
  },
): PublicPrayerRequestDto {
  return {
    title: "t",
    story: "s",
    prayerNeed: "n",
    publicIdentityMode: "anonymous",
    publicLabel: "Anônimo",
    status: "open",
    validPrayerCount: 0,
    rankedAt: "2026-11-09T00:00:00.000Z",
    createdAt: "2026-11-09T00:00:00.000Z",
    isSyntheticFixture: false,
    ...partial,
  }
}

describe("categoriesFromPrimaryFeed", () => {
  it("deriva somente categorias presentes na fila e ordena por sortOrder/nome", () => {
    const filters = categoriesFromPrimaryFeed([
      request({
        id: "1",
        category: {
          id: "c2",
          slug: "vida-espiritual",
          name: "Vida espiritual",
          sortOrder: 90,
          safetyClass: "none",
        },
      }),
      request({
        id: "2",
        category: {
          id: "c1",
          slug: "familia",
          name: "Família",
          sortOrder: 20,
          safetyClass: "none",
        },
      }),
      request({
        id: "3",
        category: {
          id: "c2",
          slug: "vida-espiritual",
          name: "Vida espiritual",
          sortOrder: 90,
          safetyClass: "none",
        },
      }),
    ])

    expect(filters.map((c) => c.slug)).toEqual(["familia", "vida-espiritual"])
  })

  it("retorna lista vazia quando a fila principal está vazia", () => {
    expect(categoriesFromPrimaryFeed([])).toEqual([])
  })

  it("não inventa categorias ausentes do conjunto ranqueado", () => {
    const filters = categoriesFromPrimaryFeed([
      request({
        id: "1",
        category: {
          id: "c9",
          slug: "vida-espiritual",
          name: "Vida espiritual",
          sortOrder: 90,
          safetyClass: "none",
        },
      }),
    ])
    expect(filters).toHaveLength(1)
    expect(filters[0]?.slug).toBe("vida-espiritual")
    expect(filters.some((c) => c.slug === "saude")).toBe(false)
  })
})
