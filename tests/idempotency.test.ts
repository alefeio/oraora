import { describe, expect, it } from "vitest"
import { fingerprintPayload, normalizeIdempotencyKey } from "@/lib/security/idempotency"

describe("idempotency helpers", () => {
  it("normaliza chave válida", () => {
    expect(normalizeIdempotencyKey("abc_12345")).toBe("abc_12345")
  })

  it("rejeita chave curta ou inválida", () => {
    expect(normalizeIdempotencyKey("short")).toBeNull()
    expect(normalizeIdempotencyKey("bad key!")).toBeNull()
  })

  it("fingerprint é estável independente da ordem das chaves", () => {
    const a = fingerprintPayload({ b: 2, a: 1 })
    const b = fingerprintPayload({ a: 1, b: 2 })
    expect(a).toBe(b)
  })

  it("fingerprint de oração considera passagem bíblica", () => {
    const base = { requestId: "req_1", body: "Mesmo texto" }
    const without = fingerprintPayload({ ...base, scripturePassageId: null })
    const withA = fingerprintPayload({ ...base, scripturePassageId: "passage_a" })
    const withB = fingerprintPayload({ ...base, scripturePassageId: "passage_b" })
    expect(without).not.toBe(withA)
    expect(withA).not.toBe(withB)
  })
})
