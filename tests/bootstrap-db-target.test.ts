import { describe, expect, it } from "vitest"
import { assertBootstrapDbTarget } from "@/modules/bootstrap"

describe("BOOT-01R db target guards", () => {
  it("aceita local alinhado intercessao_test", () => {
    const fp = assertBootstrapDbTarget("local", {
      DIRECT_URL: "postgresql://u:p@127.0.0.1:5432/intercessao_test",
      RUNTIME_DATABASE_URL: "postgresql://u:p@127.0.0.1:5432/intercessao_test",
    })
    expect(fp.classification).toBe("local_authorized")
    expect(fp.allowedForApply).toBe(true)
  })

  it("recusa Production via VERCEL_ENV", () => {
    expect(() =>
      assertBootstrapDbTarget("preview", {
        VERCEL_ENV: "production",
        DIRECT_URL: "postgresql://u:p@db.example.com/app",
        RUNTIME_DATABASE_URL: "postgresql://u:p@db.example.com/app",
      }),
    ).toThrow(/Production/)
  })

  it("não trata --env=preview sozinho como prova", () => {
    const fp = assertBootstrapDbTarget("preview", {
      DIRECT_URL: "postgresql://u:p@ep-preview.neon.tech/oraora",
      RUNTIME_DATABASE_URL: "postgresql://u:p@ep-preview.neon.tech/oraora",
      ALLOW_REMOTE_DB_WRITE: "true",
      // sem BOOTSTRAP_PREVIEW_DATABASE
    })
    expect(fp.allowedForApply).toBe(false)
    expect(fp.reason).toContain("BOOTSTRAP_PREVIEW_DATABASE")
  })

  it("aceita preview só com identificação explícita do database", () => {
    const fp = assertBootstrapDbTarget("preview", {
      DIRECT_URL: "postgresql://u:p@ep-preview.neon.tech/oraora_preview",
      RUNTIME_DATABASE_URL: "postgresql://u:p@ep-preview.neon.tech/oraora_preview",
      ALLOW_REMOTE_DB_WRITE: "true",
      BOOTSTRAP_PREVIEW_DATABASE: "oraora_preview",
    })
    expect(fp.classification).toBe("preview_remote")
    expect(fp.allowedForApply).toBe(true)
  })

  it("bloqueia declared local com host remoto", () => {
    const fp = assertBootstrapDbTarget("local", {
      DIRECT_URL: "postgresql://u:p@remote.example.com/intercessao_dev",
      RUNTIME_DATABASE_URL: "postgresql://u:p@remote.example.com/intercessao_dev",
    })
    expect(fp.allowedForApply).toBe(false)
    expect(fp.reason).toBe("declared_local_but_host_not_local")
  })

  it("bloqueia quando DIRECT e runtime divergem de database", () => {
    const fp = assertBootstrapDbTarget("local", {
      DIRECT_URL: "postgresql://u:p@127.0.0.1:5432/intercessao_test",
      RUNTIME_DATABASE_URL: "postgresql://u:p@127.0.0.1:5432/intercessao_dev",
    })
    expect(fp.allowedForApply).toBe(false)
    expect(fp.sameDatabase).toBe(false)
    expect(fp.reason).toBe("direct_and_runtime_database_diverge")
  })

  it("ALLOW_REMOTE_DB_WRITE sozinho não prova Preview", () => {
    const fp = assertBootstrapDbTarget("preview", {
      DIRECT_URL: "postgresql://u:p@ep-preview.neon.tech/oraora",
      RUNTIME_DATABASE_URL: "postgresql://u:p@ep-preview.neon.tech/oraora",
      ALLOW_REMOTE_DB_WRITE: "true",
      BOOTSTRAP_PREVIEW_DATABASE: "outro_dbname",
    })
    expect(fp.allowedForApply).toBe(false)
    expect(fp.reason).toContain("BOOTSTRAP_PREVIEW_DATABASE")
  })
})
