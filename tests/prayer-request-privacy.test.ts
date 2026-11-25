import { describe, expect, it } from "vitest"
import { toPublicPrayerRequestDto } from "@/modules/prayer-requests/public-dto"
import { EligibilityRequiredError } from "@/modules/intercession/errors"

describe("privacy DTO", () => {
  it("não inclui authorId nem campos privados", () => {
    const dto = toPublicPrayerRequestDto({
      id: "req_1",
      title: "Título",
      story: "História",
      prayerNeed: "Intenção",
      publicIdentityMode: "anonymous",
      publicLabel: "Anônimo",
      status: "open",
      validPrayerCount: 0,
      rankedAt: new Date("2026-11-09T00:00:00.000Z"),
      createdAt: new Date("2026-11-09T00:00:00.000Z"),
      isSyntheticFixture: true,
      category: {
        id: "cat_1",
        slug: "outros",
        name: "Outros",
        description: null,
        sortOrder: 1,
        safetyClass: "none",
      },
      authorId: "author_secret_id",
    })

    const serialized = JSON.stringify(dto)
    expect(serialized).not.toMatch(/authorId/)
    expect(serialized).not.toMatch(/author_secret_id/)
    expect(serialized).not.toMatch(/email/i)
    expect(serialized).not.toMatch(/telefone|phone|cpf/i)
    expect(dto.publicLabel).toBe("Anônimo")
    expect(dto.publicIdentityMode).toBe("anonymous")
    expect(dto.viewerIsAuthor).toBeUndefined()
  })

  it("marca viewerIsAuthor só para o usuário autenticado correspondente", () => {
    const row = {
      id: "req_1",
      title: "Título",
      story: "História",
      prayerNeed: "Intenção",
      publicIdentityMode: "anonymous" as const,
      publicLabel: "Anônimo",
      status: "open",
      validPrayerCount: 0,
      rankedAt: new Date("2026-11-09T00:00:00.000Z"),
      createdAt: new Date("2026-11-09T00:00:00.000Z"),
      isSyntheticFixture: false,
      authorId: "user_author",
      category: {
        id: "cat_1",
        slug: "outros",
        name: "Outros",
        description: null,
        sortOrder: 110,
        safetyClass: "none",
      },
    }

    const asAuthor = toPublicPrayerRequestDto(row, { viewerUserId: "user_author" })
    const asOther = toPublicPrayerRequestDto(row, { viewerUserId: "user_other" })

    expect(asAuthor.viewerIsAuthor).toBe(true)
    expect(JSON.stringify(asAuthor)).not.toMatch(/user_author/)
    expect(asOther.viewerIsAuthor).toBeUndefined()
    expect(asOther.publicLabel).toBe("Anônimo")
  })
})

describe("creation guard error", () => {
  it("expõe erro tipado de elegibilidade", () => {
    const error = new EligibilityRequiredError()
    expect(error.code).toBe("ELIGIBILITY_REQUIRED")
    expect(error.status).toBe(403)
  })
})
