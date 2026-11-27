import { describe, expect, it } from "vitest"
import {
  fingerprintDatabaseUrl,
  PREVIEW_DIRECT_FINGERPRINT,
  PREVIEW_POOLED_FINGERPRINT,
} from "@/lib/db/write-target"

describe("fingerprintDatabaseUrl", () => {
  it("é estável e ignora senha", () => {
    const a = fingerprintDatabaseUrl(
      "postgresql://user:secret@db.example.com:5432/postgres?sslmode=require",
    )
    const b = fingerprintDatabaseUrl(
      "postgresql://user:other@db.example.com:5432/postgres?sslmode=verify-full",
    )
    expect(a.fingerprint).toBe(b.fingerprint)
    expect(a.username).toBe("user")
    expect(a.database).toBe("postgres")
  })

  it("mantém fingerprints canônicos do Preview documentados", () => {
    expect(PREVIEW_DIRECT_FINGERPRINT).toHaveLength(16)
    expect(PREVIEW_POOLED_FINGERPRINT).toHaveLength(16)
    expect(PREVIEW_DIRECT_FINGERPRINT).not.toBe(PREVIEW_POOLED_FINGERPRINT)
  })
})
