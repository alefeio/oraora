import { describe, expect, it } from "vitest"
import { toPublicPrayerRequestDto } from "@/modules/prayer-requests/public-dto"
import {
  assertCanCreatePrayerRequest,
  PrayerRequestCreationBlockedError,
} from "@/modules/prayer-requests/creation-guard"

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
    })

    const serialized = JSON.stringify(dto)
    expect(serialized).not.toMatch(/authorId/)
    expect(serialized).not.toMatch(/email/i)
    expect(serialized).not.toMatch(/telefone|phone|cpf/i)
    expect(dto.publicLabel).toBe("Anônimo")
    expect(dto.publicIdentityMode).toBe("anonymous")
  })
})

describe("creation guard", () => {
  it("bloqueia criação de pedido por usuário comum", () => {
    expect(() =>
      assertCanCreatePrayerRequest({ actorUserId: "user_1", eligibilityId: null }),
    ).toThrow(PrayerRequestCreationBlockedError)
  })
})
