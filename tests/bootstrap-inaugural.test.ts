import { randomUUID } from "node:crypto"
import { beforeAll, describe, expect, it } from "vitest"
import { prisma } from "@/lib/db/prisma"
import {
  grantInauguralAdminEligibility,
  inspectCommunityBootstrapState,
  INAUGURAL_BOOTSTRAP_ACTION,
} from "@/modules/bootstrap"
import { getRequestEligibilitySnapshot } from "@/modules/reciprocity"
import { createPrayerRequest } from "@/modules/prayer-requests/create-request"
import { seedCategoriesIdempotent } from "@/modules/prayer-requests/categories"
import { EligibilityRequiredError } from "@/modules/intercession/errors"

const enabled = process.env.RUN_DB_TESTS === "1"
const timeout = 45_000

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

describe.runIf(enabled)("BOOT-01 inaugural admin_grant", () => {
  let categoryId = ""

  beforeAll(async () => {
    await seedCategoriesIdempotent()
    const category = await prisma.prayerRequestCategory.findFirstOrThrow({
      where: { slug: "outros" },
    })
    categoryId = category.id
  }, timeout)

  it(
    "dry-run lógico: sem ownerAuthorized bloqueia; grant único; segunda chamada idempotente; comum continua bloqueado",
    async () => {
      const founder = await createUser("Founder Boot")
      const regular = await createUser("Regular Boot")

      const denied = await grantInauguralAdminEligibility(prisma, {
        founderUserId: founder.id,
        ownerAuthorized: false,
        declaredEnvironment: "local",
      })
      expect(denied.status).toBe("blocked")
      if (denied.status === "blocked") {
        expect(denied.reason).toBe("owner_authorization_required")
      }

      const first = await grantInauguralAdminEligibility(prisma, {
        founderUserId: founder.id,
        ownerAuthorized: true,
        declaredEnvironment: "local",
        correlationId: `test_boot_${randomUUID().slice(0, 8)}`,
      })
      expect(first.status).toBe("granted")
      if (first.status !== "granted") throw new Error("expected grant")

      const snap = await getRequestEligibilitySnapshot(founder.id)
      expect(snap.canPublish).toBe(true)
      expect(snap.openEligibilityId).toBe(first.eligibilityId)

      const audits = await prisma.auditEvent.count({
        where: { action: INAUGURAL_BOOTSTRAP_ACTION, subjectId: first.eligibilityId },
      })
      expect(audits).toBe(1)

      const second = await grantInauguralAdminEligibility(prisma, {
        founderUserId: founder.id,
        ownerAuthorized: true,
        declaredEnvironment: "local",
      })
      expect(second.status).toBe("idempotent_existing")

      const regularSnap = await getRequestEligibilitySnapshot(regular.id)
      expect(regularSnap.canPublish).toBe(false)

      await expect(
        createPrayerRequest({
          authorId: regular.id,
          categoryId,
          title: "Não deveria",
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
        story:
          "Este é o pedido inaugural da comunidade Ora Ora. Pedimos oração para que o ciclo de cuidado e reciprocidade comece com respeito.",
        prayerNeed: "Pelo início saudável desta comunidade de oração.",
        publicIdentityMode: "anonymous",
        publicLabel: "Anônimo",
        idempotencyKey: `boot_req_${randomUUID().slice(0, 8)}`,
      })
      expect(published.prayerRequest.title).toContain("início desta comunidade")

      const after = await getRequestEligibilitySnapshot(founder.id)
      expect(after.canPublish).toBe(false)

      const inspection = await inspectCommunityBootstrapState(prisma)
      expect(inspection.realRequestCount).toBeGreaterThanOrEqual(1)
      expect(inspection.communityInitialized).toBe(true)

      const third = await grantInauguralAdminEligibility(prisma, {
        founderUserId: founder.id,
        ownerAuthorized: true,
        declaredEnvironment: "local",
      })
      expect(["blocked", "idempotent_existing"]).toContain(third.status)
    },
    timeout,
  )
})

describe("BOOT-01 unit guards (sem DB)", () => {
  it("exporta ação de auditoria estável", async () => {
    const { INAUGURAL_BOOTSTRAP_ACTION: action } = await import("@/modules/bootstrap")
    expect(action).toBe("bootstrap.inaugural_admin_grant")
  })
})
