import { randomUUID } from "node:crypto"
import { beforeAll, describe, expect, it } from "vitest"
import { prisma } from "@/lib/db/prisma"
import { submitPrayer } from "@/modules/intercession/submit-prayer"
import { decidePrayerValidation } from "@/modules/intercession/validate-prayer"
import {
  createDbTestRequest,
  createDbTestUser,
  dbTestTimeout,
  getDbTestCategoryId,
} from "./db-test-helpers"

const enabled = process.env.RUN_DB_TESTS === "1"

describe.runIf(enabled)("validation concurrency database", () => {
  let categoryId = ""

  beforeAll(async () => {
    categoryId = await getDbTestCategoryId()
  }, dbTestTimeout)

  it(
    "approve e reject concorrentes têm um único vencedor e efeitos coerentes",
    async () => {
      const owner = await createDbTestUser("Concurrency Owner")
      const intercessor = await createDbTestUser("Concurrency Intercessor")
      const adminA = await createDbTestUser("Concurrency Admin A", "ADMIN")
      const adminB = await createDbTestUser("Concurrency Admin B", "ADMIN")
      const request = await createDbTestRequest(owner.id, categoryId)
      const submitted = await submitPrayer({
        intercessorId: intercessor.id,
        requestId: request.id,
        body: "Oração cuidadosa para validar a concorrência administrativa.",
        idempotencyKey: `valrace_${randomUUID().slice(0, 12)}`,
      })

      const attempts = await Promise.allSettled([
        decidePrayerValidation({
          prayerId: submitted.prayer.id,
          actorUserId: adminA.id,
          outcome: "accepted",
        }),
        decidePrayerValidation({
          prayerId: submitted.prayer.id,
          actorUserId: adminB.id,
          outcome: "rejected",
        }),
      ])
      expect(attempts.filter((attempt) => attempt.status === "fulfilled")).toHaveLength(1)
      expect(attempts.filter((attempt) => attempt.status === "rejected")).toHaveLength(1)

      const validation = await prisma.prayerValidation.findUniqueOrThrow({
        where: { prayerId: submitted.prayer.id },
      })
      const eligibility = await prisma.requestEligibility.findUnique({
        where: { sourcePrayerId: submitted.prayer.id },
      })
      const refreshed = await prisma.prayerRequest.findUniqueOrThrow({
        where: { id: request.id },
      })
      expect(Boolean(eligibility)).toBe(validation.outcome === "accepted")
      expect(refreshed.validPrayerCount).toBe(validation.outcome === "accepted" ? 1 : 0)
      expect(
        await prisma.auditEvent.count({
          where: {
            action: "prayer.validation_decided",
            subjectId: submitted.prayer.id,
          },
        }),
      ).toBe(1)
    },
    dbTestTimeout,
  )
})
