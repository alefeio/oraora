import { randomUUID } from "node:crypto"
import { beforeAll, describe, expect, it } from "vitest"
import { prisma } from "@/lib/db/prisma"
import { getPrayerReadAccess } from "@/modules/intercession/authorization"
import { submitPrayer } from "@/modules/intercession/submit-prayer"
import { decidePrayerValidation } from "@/modules/intercession/validate-prayer"
import { createPrayerRequest } from "@/modules/prayer-requests/create-request"
import {
  createDbTestRequest,
  createDbTestUser,
  dbTestTimeout,
  getDbTestCategoryId,
} from "./db-test-helpers"

const enabled = process.env.RUN_DB_TESTS === "1"

describe.runIf(enabled)("HTTP authorization domain coverage", () => {
  let categoryId = ""

  beforeAll(async () => {
    categoryId = await getDbTestCategoryId()
  }, dbTestTimeout)

  it(
    "A não lê oração de B e administradores banidos ou usuários comuns não validam",
    async () => {
      const beneficiary = await createDbTestUser("Authz Beneficiary")
      const intercessor = await createDbTestUser("Authz Intercessor")
      const outsider = await createDbTestUser("Authz Outsider")
      const bannedAdmin = await createDbTestUser("Authz Banned Admin", "ADMIN", true)
      const target = await createDbTestRequest(beneficiary.id, categoryId)
      const submitted = await submitPrayer({
        intercessorId: intercessor.id,
        requestId: target.id,
        body: "Oração privada entre os atores autorizados.",
        idempotencyKey: `authz_${randomUUID().slice(0, 12)}`,
      })
      const prayer = await prisma.prayer.findUniqueOrThrow({
        where: { id: submitted.prayer.id },
        include: { validation: true },
      })

      expect(getPrayerReadAccess(outsider, prayer)).toBe("forbidden")
      expect(getPrayerReadAccess(beneficiary, prayer)).toBe("hidden")
      expect(getPrayerReadAccess(intercessor, prayer)).toBe("allowed")
      await expect(
        decidePrayerValidation({
          prayerId: prayer.id,
          actorUserId: outsider.id,
          outcome: "accepted",
        }),
      ).rejects.toMatchObject({ code: "ADMIN_REQUIRED" })
      await expect(
        decidePrayerValidation({
          prayerId: prayer.id,
          actorUserId: bannedAdmin.id,
          outcome: "accepted",
        }),
      ).rejects.toMatchObject({ code: "ADMIN_REQUIRED" })
    },
    dbTestTimeout,
  )

  it(
    "criação fixa authorId e identidade pública a partir do ator",
    async () => {
      const actor = await createDbTestUser("Maria da Silva")
      await prisma.requestEligibility.create({
        data: { userId: actor.id, sourceType: "admin_grant", status: "open" },
      })
      const result = await createPrayerRequest({
        authorId: actor.id,
        categoryId,
        title: "Pedido autenticado",
        story: "Criado pelo ator da sessão",
        prayerNeed: "Oração",
        publicIdentityMode: "initials",
        idempotencyKey: `actor_${randomUUID().slice(0, 12)}`,
      })
      const stored = await prisma.prayerRequest.findUniqueOrThrow({
        where: { id: result.prayerRequest.id },
      })
      expect(stored.authorId).toBe(actor.id)
      expect(stored.publicLabel).toBe("M.D.S")
    },
    dbTestTimeout,
  )
})
