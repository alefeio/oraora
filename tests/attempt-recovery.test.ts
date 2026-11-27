import { describe, expect, it } from "vitest"
import { interpretReconcileResponse } from "@/lib/prayer/attempt-recovery"

describe("interpretReconcileResponse", () => {
  it("distingue found / in_progress / not_found", () => {
    expect(
      interpretReconcileResponse(
        { ok: true, status: 200 },
        { status: "found", prayer: { id: "p1" } },
        false,
      ),
    ).toBe("found")
    expect(
      interpretReconcileResponse({ ok: true, status: 200 }, { status: "in_progress" }, false),
    ).toBe("in_progress")
    expect(
      interpretReconcileResponse({ ok: true, status: 200 }, { status: "not_found" }, false),
    ).toBe("not_found")
  })

  it("não interpreta falha HTTP/JSON/rede como not_found", () => {
    expect(interpretReconcileResponse(null, null, true)).toBe("unavailable")
    expect(interpretReconcileResponse({ ok: false, status: 503 }, { status: "not_found" }, false)).toBe(
      "unavailable",
    )
    expect(interpretReconcileResponse({ ok: true, status: 200 }, null, false)).toBe("unavailable")
    expect(interpretReconcileResponse({ ok: true, status: 200 }, {}, false)).toBe("unavailable")
    expect(
      interpretReconcileResponse({ ok: true, status: 200 }, { status: "unavailable" }, false),
    ).toBe("unavailable")
  })

  it("found sem prayer id vira unavailable", () => {
    expect(
      interpretReconcileResponse({ ok: true, status: 200 }, { status: "found" }, false),
    ).toBe("unavailable")
  })
})
