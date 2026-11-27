import { randomUUID } from "node:crypto"
import { beforeAll, describe, expect, it } from "vitest"
import { createHash } from "node:crypto"
import { prisma } from "@/lib/db/prisma"
import { getPrayerReadAccess } from "@/modules/intercession/authorization"
import { listReceivedPrayersForBeneficiary } from "@/modules/intercession/list-received-prayers"
import { submitPrayer } from "@/modules/intercession/submit-prayer"
import {
  createDbTestRequest,
  createDbTestUser,
  dbTestTimeout,
  getDbTestCategoryId,
} from "./db-test-helpers"

const enabled = process.env.RUN_DB_TESTS === "1"

describe.runIf(enabled)("received prayers database", () => {
  let categoryId = ""

  beforeAll(async () => {
    categoryId = await getDbTestCategoryId()
  }, dbTestTimeout)

  it(
    "lista só accepted do beneficiário e bloqueia terceiros / pendentes",
    async () => {
      const beneficiary = await createDbTestUser("Recv Beneficiary")
      const intercessor = await createDbTestUser("Recv Intercessor")
      const stranger = await createDbTestUser("Recv Stranger")
      const request = await createDbTestRequest(beneficiary.id, categoryId)

      const accepted = await submitPrayer({
        intercessorId: intercessor.id,
        requestId: request.id,
        body: "Que haja paz e cuidado nesta caminhada de fé.",
        idempotencyKey: `recv_${randomUUID().slice(0, 12)}`,
      })
      expect(accepted.prayer.validation?.outcome).toBe("accepted")

      const body = "Texto ainda em verificação humana objetiva."
      const contentHash = createHash("sha256")
        .update(body.normalize("NFKC").toLowerCase())
        .digest("hex")
      await prisma.prayer.create({
        data: {
          requestId: request.id,
          intercessorId: intercessor.id,
          beneficiaryId: beneficiary.id,
          medium: "text",
          body,
          status: "submitted",
          contentHash,
          idempotencyKey: `recvpend_${randomUUID().slice(0, 12)}`,
          validation: {
            create: {
              policyVersion: 2,
              outcome: "manual_review",
              effects: { reciprocity: null, feedCount: null, solidarity: null },
            },
          },
        },
      })

      const listed = await listReceivedPrayersForBeneficiary({
        beneficiaryId: beneficiary.id,
      })
      expect(listed.map((p) => p.id)).toContain(accepted.prayer.id)
      expect(listed.every((p) => p.validationOutcome === "accepted")).toBe(true)
      expect(listed.every((p) => !("intercessorId" in p))).toBe(true)

      expect(
        getPrayerReadAccess(
          { id: stranger.id, role: "USER" },
          {
            intercessorId: intercessor.id,
            beneficiaryId: beneficiary.id,
            validation: { outcome: "accepted" },
          },
        ),
      ).toBe("forbidden")

      expect(
        getPrayerReadAccess(
          { id: beneficiary.id, role: "USER" },
          {
            intercessorId: intercessor.id,
            beneficiaryId: beneficiary.id,
            validation: { outcome: "manual_review" },
          },
        ),
      ).toBe("hidden")
    },
    dbTestTimeout,
  )
})
