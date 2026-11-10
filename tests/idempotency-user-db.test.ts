import { randomUUID } from "node:crypto"
import { beforeAll, describe, expect, it } from "vitest"
import { prisma } from "@/lib/db/prisma"
import { submitPrayer } from "@/modules/intercession/submit-prayer"
import { createPrayerRequest } from "@/modules/prayer-requests/create-request"
import {
  createDbTestRequest,
  createDbTestUser,
  dbTestTimeout,
  getDbTestCategoryId,
} from "./db-test-helpers"

const enabled = process.env.RUN_DB_TESTS === "1"

describe.runIf(enabled)("idempotency per user and payload", () => {
  let categoryId = ""

  beforeAll(async () => {
    categoryId = await getDbTestCategoryId()
  }, dbTestTimeout)

  it(
    "isola a mesma chave entre usuários e rejeita payload divergente",
    async () => {
      const owner = await createDbTestUser("Idempotency Owner")
      const userA = await createDbTestUser("Idempotency User A")
      const userB = await createDbTestUser("Idempotency User B")
      const target = await createDbTestRequest(owner.id, categoryId)
      const key = `shared_${randomUUID().slice(0, 12)}`

      const firstA = await submitPrayer({
        intercessorId: userA.id,
        requestId: target.id,
        body: "Oração idempotente do primeiro usuário.",
        idempotencyKey: key,
      })
      const replayA = await submitPrayer({
        intercessorId: userA.id,
        requestId: target.id,
        body: "Oração idempotente do primeiro usuário.",
        idempotencyKey: key,
      })
      const firstB = await submitPrayer({
        intercessorId: userB.id,
        requestId: target.id,
        body: "Oração independente do segundo usuário.",
        idempotencyKey: key,
      })

      expect(replayA.reused).toBe(true)
      expect(replayA.prayer.id).toBe(firstA.prayer.id)
      expect(firstB.prayer.id).not.toBe(firstA.prayer.id)
      await expect(
        submitPrayer({
          intercessorId: userA.id,
          requestId: target.id,
          body: "Payload divergente com a mesma chave.",
          idempotencyKey: key,
        }),
      ).rejects.toMatchObject({ code: "IDEMPOTENCY_PAYLOAD_CONFLICT", status: 409 })
    },
    dbTestTimeout,
  )

  it(
    "reutiliza publicação apenas para o mesmo usuário e payload",
    async () => {
      const userA = await createDbTestUser("Publish Same Name")
      const userB = await createDbTestUser("Publish Other Name")
      await prisma.requestEligibility.createMany({
        data: [
          { userId: userA.id, sourceType: "admin_grant", status: "open" },
          { userId: userB.id, sourceType: "admin_grant", status: "open" },
        ],
      })
      const key = `publish_${randomUUID().slice(0, 12)}`
      const payload = {
        categoryId,
        title: "Pedido idempotente",
        story: "História canônica",
        prayerNeed: "Necessidade canônica",
        publicIdentityMode: "given_name" as const,
        idempotencyKey: key,
      }

      const first = await createPrayerRequest({ authorId: userA.id, ...payload })
      const replay = await createPrayerRequest({ authorId: userA.id, ...payload })
      const independent = await createPrayerRequest({ authorId: userB.id, ...payload })
      expect(replay.reused).toBe(true)
      expect(replay.prayerRequest.id).toBe(first.prayerRequest.id)
      expect(independent.prayerRequest.id).not.toBe(first.prayerRequest.id)

      await expect(
        createPrayerRequest({
          authorId: userA.id,
          ...payload,
          title: "Outro título",
        }),
      ).rejects.toMatchObject({ code: "IDEMPOTENCY_PAYLOAD_CONFLICT", status: 409 })
    },
    dbTestTimeout,
  )
})
