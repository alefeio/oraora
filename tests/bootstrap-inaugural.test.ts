import { randomUUID } from "node:crypto"
import { beforeAll, describe, expect, it } from "vitest"
import { PrismaClient } from "@/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { config as loadEnv } from "dotenv"
import {
  grantInauguralAdminEligibility,
  INAUGURAL_BOOTSTRAP_ACTION,
  INAUGURAL_POLICY_DOMAIN,
  INAUGURAL_POLICY_VERSION,
} from "@/modules/bootstrap"
import { getRequestEligibilitySnapshot } from "@/modules/reciprocity"
import { createPrayerRequest } from "@/modules/prayer-requests/create-request"
import { seedCategoriesIdempotent } from "@/modules/prayer-requests/categories"
import { EligibilityRequiredError } from "@/modules/intercession/errors"
import { prisma } from "@/lib/db/prisma"
import { resolveRuntimeDatabaseUrl } from "@/lib/db/connection"

loadEnv({ path: ".env.local", quiet: true })
loadEnv({ path: ".env", quiet: true })

const enabled = process.env.RUN_DB_TESTS === "1"
const timeout = 60_000

async function createUser(label: string, role = "USER") {
  const suffix = randomUUID().replace(/-/g, "").slice(0, 12)
  return prisma.user.create({
    data: {
      id: randomUUID().replace(/-/g, ""),
      name: label,
      email: `${label.toLowerCase().replace(/\s+/g, ".")}.${suffix}@test.local`,
      emailVerified: true,
      role,
    },
  })
}

async function resetBootstrapArtifacts() {
  await prisma.requestEligibility.deleteMany({ where: { sourceType: "admin_grant" } })
  await prisma.auditEvent.deleteMany({ where: { action: INAUGURAL_BOOTSTRAP_ACTION } })
  await prisma.policyDocument.deleteMany({
    where: { domain: INAUGURAL_POLICY_DOMAIN, version: INAUGURAL_POLICY_VERSION },
  })
}

function independentClient() {
  const runtime = resolveRuntimeDatabaseUrl()
  const pool = new Pool({ connectionString: runtime.url, max: 1 })
  const adapter = new PrismaPg(pool)
  const client = new PrismaClient({ adapter })
  return { client, pool }
}

describe("BOOT-01 unit guards (sem DB)", () => {
  it("exporta ação e domínio de lock estáveis", async () => {
    expect(INAUGURAL_BOOTSTRAP_ACTION).toBe("bootstrap.inaugural_admin_grant")
    expect(INAUGURAL_POLICY_DOMAIN).toBe("community_bootstrap")
    expect(INAUGURAL_POLICY_VERSION).toBe(1)
  })
})

describe.runIf(enabled)("BOOT-01R inaugural admin_grant (DB)", () => {
  let categoryId = ""

  beforeAll(async () => {
    await seedCategoriesIdempotent()
    const category = await prisma.prayerRequestCategory.findFirstOrThrow({
      where: { slug: "outros" },
    })
    categoryId = category.id
  }, timeout)

  it(
    "sem autorização bloqueia; grant único; idempotência; comum bloqueado; consumo impede novo grant",
    async () => {
      await resetBootstrapArtifacts()
      const founder = await createUser("Founder BootR")
      const regular = await createUser("Regular BootR")

      const denied = await grantInauguralAdminEligibility(prisma, {
        founderUserId: founder.id,
        ownerAuthorized: false,
        declaredEnvironment: "local",
        operator: { kind: "system_operator", label: "test-cli" },
        enforceDbTarget: false,
      })
      expect(denied.status).toBe("blocked")

      const first = await grantInauguralAdminEligibility(prisma, {
        founderUserId: founder.id,
        ownerAuthorized: true,
        declaredEnvironment: "local",
        operator: { kind: "system_operator", label: "test-cli" },
        correlationId: `test_boot_${randomUUID().slice(0, 8)}`,
        enforceDbTarget: false,
      })
      expect(first.status).toBe("granted")
      if (first.status !== "granted") throw new Error("expected grant")

      const audit = await prisma.auditEvent.findFirst({
        where: { action: INAUGURAL_BOOTSTRAP_ACTION, subjectId: first.eligibilityId },
      })
      expect(audit?.actorType).toBe("system")
      expect(audit?.actorUserId).toBeNull()
      const meta = audit?.metadata as { beneficiaryUserIdPrefix?: string; operatorKind?: string }
      expect(meta.operatorKind).toBe("system_operator")
      expect(meta.beneficiaryUserIdPrefix).toBe(founder.id.slice(0, 8))

      const second = await grantInauguralAdminEligibility(prisma, {
        founderUserId: founder.id,
        ownerAuthorized: true,
        declaredEnvironment: "local",
        operator: { kind: "system_operator", label: "test-cli" },
        enforceDbTarget: false,
      })
      expect(second.status).toBe("idempotent_existing")

      expect((await getRequestEligibilitySnapshot(regular.id)).canPublish).toBe(false)
      await expect(
        createPrayerRequest({
          authorId: regular.id,
          categoryId,
          title: "Não",
          story: "x",
          prayerNeed: "y",
          publicIdentityMode: "anonymous",
          publicLabel: "Anônimo",
          idempotencyKey: `noelig_${randomUUID().slice(0, 8)}`,
        }),
      ).rejects.toBeInstanceOf(EligibilityRequiredError)

      const published = await createPrayerRequest({
        authorId: founder.id,
        categoryId,
        title: "Orem pelo início desta comunidade",
        story: "Pedido inaugural de teste isolado.",
        prayerNeed: "Pelo início da comunidade.",
        publicIdentityMode: "anonymous",
        publicLabel: "Anônimo",
        idempotencyKey: `boot_req_${randomUUID().slice(0, 8)}`,
      })
      expect(published.prayerRequest.id).toBeTruthy()
      expect((await getRequestEligibilitySnapshot(founder.id)).canPublish).toBe(false)

      const afterConsume = await grantInauguralAdminEligibility(prisma, {
        founderUserId: founder.id,
        ownerAuthorized: true,
        declaredEnvironment: "local",
        operator: { kind: "system_operator", label: "test-cli" },
        enforceDbTarget: false,
      })
      expect(["blocked", "idempotent_existing"]).toContain(afterConsume.status)
    },
    timeout,
  )

  it(
    "duas concessões concorrentes (conexões independentes) não criam dois grants",
    async () => {
      await resetBootstrapArtifacts()
      // Remove pedidos reais deste teste anterior que marcam comunidade inicializada
      await prisma.prayerRequest.deleteMany({
        where: { title: "Orem pelo início desta comunidade", isSyntheticFixture: false },
      })
      await resetBootstrapArtifacts()

      const founderA = await createUser("Founder A Conc")
      const founderB = await createUser("Founder B Conc")
      const a = independentClient()
      const b = independentClient()

      try {
        const [r1, r2] = await Promise.all([
          grantInauguralAdminEligibility(a.client, {
            founderUserId: founderA.id,
            ownerAuthorized: true,
            declaredEnvironment: "local",
            operator: { kind: "system_operator", label: "conn-a" },
            enforceDbTarget: false,
          }),
          grantInauguralAdminEligibility(b.client, {
            founderUserId: founderB.id,
            ownerAuthorized: true,
            declaredEnvironment: "local",
            operator: { kind: "system_operator", label: "conn-b" },
            enforceDbTarget: false,
          }),
        ])

        const granted = [r1, r2].filter((r) => r.status === "granted")
        expect(granted.length).toBe(1)
        const grants = await prisma.requestEligibility.count({
          where: { sourceType: "admin_grant" },
        })
        expect(grants).toBe(1)
        const policies = await prisma.policyDocument.count({
          where: { domain: INAUGURAL_POLICY_DOMAIN, version: INAUGURAL_POLICY_VERSION },
        })
        expect(policies).toBe(1)
      } finally {
        await a.client.$disconnect()
        await b.client.$disconnect()
        await a.pool.end()
        await b.pool.end()
      }
    },
    timeout,
  )

  it(
    "fundador inexistente bloqueado; operador admin falso bloqueado",
    async () => {
      await resetBootstrapArtifacts()
      await prisma.prayerRequest.deleteMany({
        where: { title: "Orem pelo início desta comunidade", isSyntheticFixture: false },
      })
      await resetBootstrapArtifacts()

      const missing = await grantInauguralAdminEligibility(prisma, {
        founderUserId: "missingfounder0001",
        ownerAuthorized: true,
        declaredEnvironment: "local",
        operator: { kind: "system_operator", label: "test" },
        enforceDbTarget: false,
      })
      expect(missing.status).toBe("blocked")
      if (missing.status === "blocked") expect(missing.reason).toBe("founder_unavailable")

      const fakeAdmin = await createUser("Fake Admin", "USER")
      const founder = await createUser("Founder Auth")
      const badOp = await grantInauguralAdminEligibility(prisma, {
        founderUserId: founder.id,
        ownerAuthorized: true,
        declaredEnvironment: "local",
        operator: { kind: "verified_admin", userId: fakeAdmin.id },
        enforceDbTarget: false,
      })
      expect(badOp.status).toBe("blocked")
      if (badOp.status === "blocked") expect(badOp.reason).toBe("operator_not_verified_admin")
    },
    timeout,
  )
})
