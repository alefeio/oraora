import { randomUUID } from "node:crypto"
import { beforeAll, describe, expect, it } from "vitest"
import { prisma } from "@/lib/db/prisma"
import { invalidatePrayerValidation } from "@/modules/intercession/invalidate-prayer"
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

describe.runIf(enabled)("validation invalidation database", () => {
  let categoryId = ""

  beforeAll(async () => {
    categoryId = await getDbTestCategoryId()
  }, dbTestTimeout)

  it(
    "preserva histórico, revoga direito aberto e reconta o feed",
    async () => {
      const owner = await createDbTestUser("Invalidate Open Owner")
      const intercessor = await createDbTestUser("Invalidate Open User")
      const admin = await createDbTestUser("Invalidate Open Admin", "ADMIN")
      const target = await createDbTestRequest(owner.id, categoryId)
      const prayer = await submitPrayer({
        intercessorId: intercessor.id,
        requestId: target.id,
        body: "Oração posteriormente invalidada, mantendo todo o histórico.",
        idempotencyKey: `invopen_${randomUUID().slice(0, 12)}`,
      })
      await decidePrayerValidation({
        prayerId: prayer.prayer.id,
        actorUserId: admin.id,
        outcome: "accepted",
      })

      await invalidatePrayerValidation({
        prayerId: prayer.prayer.id,
        actorUserId: admin.id,
        rationale: "Conteúdo incompatível identificado em revisão.",
      })

      const eligibility = await prisma.requestEligibility.findUniqueOrThrow({
        where: { sourcePrayerId: prayer.prayer.id },
      })
      expect(eligibility.status).toBe("revoked")
      expect(
        (
          await prisma.prayerRequest.findUniqueOrThrow({
            where: { id: target.id },
          })
        ).validPrayerCount,
      ).toBe(0)
      expect(
        await prisma.prayerValidationRevision.count({
          where: { prayerId: prayer.prayer.id },
        }),
      ).toBe(1)
    },
    dbTestTimeout,
  )

  it(
    "não apaga pedido após consumo e sinaliza compensação futura",
    async () => {
      const owner = await createDbTestUser("Invalidate Consumed Owner")
      const intercessor = await createDbTestUser("Invalidate Consumed User")
      const admin = await createDbTestUser("Invalidate Consumed Admin", "ADMIN")
      const target = await createDbTestRequest(owner.id, categoryId)
      const prayer = await submitPrayer({
        intercessorId: intercessor.id,
        requestId: target.id,
        body: "Oração aceita cujo direito será consumido antes da revisão.",
        idempotencyKey: `invused_${randomUUID().slice(0, 12)}`,
      })
      await decidePrayerValidation({
        prayerId: prayer.prayer.id,
        actorUserId: admin.id,
        outcome: "accepted",
      })
      const published = await createPrayerRequest({
        authorId: intercessor.id,
        categoryId,
        title: "Pedido preservado",
        story: "Direito já consumido",
        prayerNeed: "Requer moderação",
        publicIdentityMode: "anonymous",
        idempotencyKey: `invpublish_${randomUUID().slice(0, 12)}`,
      })

      const result = await invalidatePrayerValidation({
        prayerId: prayer.prayer.id,
        actorUserId: admin.id,
        rationale: "Invalidação posterior ao consumo.",
      })
      expect(result.financialCompensationRequired).toBe(true)
      const preserved = await prisma.prayerRequest.findUniqueOrThrow({
        where: { id: published.prayerRequest.id },
      })
      expect(preserved.moderationPending).toBe(true)
      const revision = await prisma.prayerValidationRevision.findUniqueOrThrow({
        where: { id: result.revisionId },
      })
      expect(revision.metadata).toMatchObject({ financialCompensationRequired: true })
    },
    dbTestTimeout,
  )
})
