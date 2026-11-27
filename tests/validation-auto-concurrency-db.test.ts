import { randomUUID } from "node:crypto"
import { beforeAll, describe, expect, it } from "vitest"
import { prisma } from "@/lib/db/prisma"
import { submitPrayer } from "@/modules/intercession/submit-prayer"
import {
  createDbTestRequest,
  createDbTestUser,
  dbTestTimeout,
  getDbTestCategoryId,
} from "./db-test-helpers"

const enabled = process.env.RUN_DB_TESTS === "1"

describe.runIf(enabled)("automatic validation concurrency", () => {
  let categoryId = ""

  beforeAll(async () => {
    categoryId = await getDbTestCategoryId()
  }, dbTestTimeout)

  it(
    "submissões concorrentes do mesmo intercessor: no máximo uma elegibilidade aberta",
    async () => {
      const ownerA = await createDbTestUser("AutoConc Owner A")
      const ownerB = await createDbTestUser("AutoConc Owner B")
      const intercessor = await createDbTestUser("AutoConc Intercessor")
      const requestA = await createDbTestRequest(ownerA.id, categoryId)
      const requestB = await createDbTestRequest(ownerB.id, categoryId)

      const attempts = await Promise.allSettled([
        submitPrayer({
          intercessorId: intercessor.id,
          requestId: requestA.id,
          body: "Primeira oração concorrente com cuidado real pela pessoa.",
          idempotencyKey: `ac1_${randomUUID().slice(0, 12)}`,
        }),
        submitPrayer({
          intercessorId: intercessor.id,
          requestId: requestB.id,
          body: "Segunda oração concorrente com cuidado real pela pessoa.",
          idempotencyKey: `ac2_${randomUUID().slice(0, 12)}`,
        }),
      ])

      const ok = attempts.filter((a) => a.status === "fulfilled")
      expect(ok.length).toBe(2)

      for (const attempt of ok) {
        if (attempt.status === "fulfilled") {
          expect(attempt.value.prayer.validation?.outcome).toBe("accepted")
        }
      }

      const open = await prisma.requestEligibility.count({
        where: { userId: intercessor.id, status: "open" },
      })
      expect(open).toBe(1)

      const linked = await prisma.requestEligibility.count({
        where: { userId: intercessor.id },
      })
      expect(linked).toBeLessThanOrEqual(2)
    },
    dbTestTimeout,
  )

  it(
    "reenvio idempotente concorrente não duplica efeitos",
    async () => {
      const owner = await createDbTestUser("AutoIdem Owner")
      const intercessor = await createDbTestUser("AutoIdem Intercessor")
      const request = await createDbTestRequest(owner.id, categoryId)
      const key = `acidem_${randomUUID().slice(0, 12)}`
      const body = "Oração idempotente sob corrida com conteúdo significativo."

      const attempts = await Promise.allSettled([
        submitPrayer({
          intercessorId: intercessor.id,
          requestId: request.id,
          body,
          idempotencyKey: key,
        }),
        submitPrayer({
          intercessorId: intercessor.id,
          requestId: request.id,
          body,
          idempotencyKey: key,
        }),
      ])

      const ok = attempts.filter((a) => a.status === "fulfilled")
      expect(ok.length).toBe(2)
      const ids = ok.map((a) =>
        a.status === "fulfilled" ? a.value.prayer.id : null,
      )
      expect(ids[0]).toBe(ids[1])

      expect(
        await prisma.prayer.count({
          where: { intercessorId: intercessor.id, idempotencyKey: key },
        }),
      ).toBe(1)
      expect(
        await prisma.requestEligibility.count({
          where: { userId: intercessor.id, status: "open" },
        }),
      ).toBe(1)
      expect(
        (
          await prisma.prayerRequest.findUniqueOrThrow({
            where: { id: request.id },
          })
        ).validPrayerCount,
      ).toBe(1)
    },
    dbTestTimeout,
  )
})
