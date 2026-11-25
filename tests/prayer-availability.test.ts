import { describe, expect, it } from "vitest"
import { getPrayerSubmissionAvailability } from "@/modules/intercession/prayer-availability"
import { getPrayerReadAccess } from "@/modules/intercession/authorization"

describe("getPrayerSubmissionAvailability", () => {
  it("bloqueia auto-oração", () => {
    const result = getPrayerSubmissionAvailability({
      requestStatus: "open",
      contentVisibility: "authenticated",
      viewerIsAuthor: true,
    })
    expect(result.canSubmit).toBe(false)
    if (!result.canSubmit) expect(result.reason).toBe("SELF_PRAYER_FORBIDDEN")
  })

  it("bloqueia pedido encerrado e removido", () => {
    expect(
      getPrayerSubmissionAvailability({
        requestStatus: "closed",
        contentVisibility: "authenticated",
        viewerIsAuthor: false,
      }).canSubmit,
    ).toBe(false)
    expect(
      getPrayerSubmissionAvailability({
        requestStatus: "removed",
        contentVisibility: "authenticated",
        viewerIsAuthor: false,
      }).canSubmit,
    ).toBe(false)
  })

  it("permite open e paused (espelha submitPrayer atual)", () => {
    expect(
      getPrayerSubmissionAvailability({
        requestStatus: "open",
        contentVisibility: "authenticated",
        viewerIsAuthor: false,
      }).canSubmit,
    ).toBe(true)
    expect(
      getPrayerSubmissionAvailability({
        requestStatus: "paused",
        contentVisibility: "authenticated",
        viewerIsAuthor: false,
      }).canSubmit,
    ).toBe(true)
  })
})

describe("getPrayerReadAccess", () => {
  const prayer = {
    intercessorId: "inter_1",
    beneficiaryId: "ben_1",
    validation: { outcome: "pending" },
  }

  it("permite intercessor e oculta pendente do beneficiário", () => {
    expect(getPrayerReadAccess({ id: "inter_1", role: "USER" }, prayer)).toBe("allowed")
    expect(getPrayerReadAccess({ id: "ben_1", role: "USER" }, prayer)).toBe("hidden")
  })

  it("permite beneficiário após aceitação", () => {
    expect(
      getPrayerReadAccess(
        { id: "ben_1", role: "USER" },
        { ...prayer, validation: { outcome: "accepted" } },
      ),
    ).toBe("allowed")
  })

  it("bloqueia conta suspensa e terceiros", () => {
    expect(
      getPrayerReadAccess({ id: "inter_1", role: "USER", banned: true }, prayer),
    ).toBe("forbidden")
    expect(getPrayerReadAccess({ id: "other", role: "USER" }, prayer)).toBe("forbidden")
  })
})
