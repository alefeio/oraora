import { createHash, randomUUID } from "node:crypto"
import { beforeAll, describe, expect, it } from "vitest"
import { prisma } from "@/lib/db/prisma"
import { getPrayerReadAccess } from "@/modules/intercession/authorization"
import { reprocessLegacyPrayer } from "@/modules/intercession/reprocess-legacy-prayer"
import { submitPrayer } from "@/modules/intercession/submit-prayer"
import { decidePrayerValidation } from "@/modules/intercession/validate-prayer"
import { VALIDATION_POLICY_VERSION } from "@/modules/intercession/validation-policy-v2"
import { getRequestEligibilitySnapshot } from "@/modules/reciprocity"
import {
  createDbTestRequest,
  createDbTestUser,
  dbTestTimeout,
  getDbTestCategoryId,
} from "./db-test-helpers"

const enabled = process.env.RUN_DB_TESTS === "1"

async function createQueuedPrayer(input: {
  requestId: string
  intercessorId: string
  beneficiaryId: string
  body: string
  outcome?: "pending" | "manual_review"
}) {
  const body = input.body.trim()
  const contentHash = createHash("sha256")
    .update(body.normalize("NFKC").toLowerCase())
    .digest("hex")
  return prisma.prayer.create({
    data: {
      requestId: input.requestId,
      intercessorId: input.intercessorId,
      beneficiaryId: input.beneficiaryId,
      medium: "text",
      body,
      status: "submitted",
      contentHash,
      idempotencyKey: `queue_${randomUUID().slice(0, 12)}`,
      validation: {
        create: {
          policyVersion: 1,
          outcome: input.outcome ?? "pending",
          effects: { reciprocity: null, feedCount: null, solidarity: null },
          signals: { legacy: true },
        },
      },
    },
    include: { validation: true },
  })
}

describe.runIf(enabled)("automatic validation V2 database", () => {
  let categoryId = ""

  beforeAll(async () => {
    categoryId = await getDbTestCategoryId()
  }, dbTestTimeout)

  it(
    "oração legítima aceita automaticamente com elegibilidade e contagem",
    async () => {
      const owner = await createDbTestUser("Auto Owner")
      const intercessor = await createDbTestUser("Auto Intercessor")
      const request = await createDbTestRequest(owner.id, categoryId)

      const submitted = await submitPrayer({
        intercessorId: intercessor.id,
        requestId: request.id,
        body: "Senhor, cuida desta pessoa com misericórdia e paz.",
        idempotencyKey: `auto_${randomUUID().slice(0, 12)}`,
      })

      expect(submitted.prayer.validation?.outcome).toBe("accepted")
      expect(submitted.prayer.validation?.policyVersion).toBe(VALIDATION_POLICY_VERSION)
      expect(submitted.prayer.validation?.decidedAt).toBeTruthy()

      const snap = await getRequestEligibilitySnapshot(intercessor.id)
      expect(snap.canPublish).toBe(true)

      const refreshed = await prisma.prayerRequest.findUniqueOrThrow({
        where: { id: request.id },
      })
      expect(refreshed.validPrayerCount).toBe(1)

      const validation = await prisma.prayerValidation.findUniqueOrThrow({
        where: { prayerId: submitted.prayer.id },
      })
      expect(validation.decidedByUserId).toBeNull()

      expect(
        getPrayerReadAccess(
          { id: owner.id, role: "USER" },
          {
            intercessorId: intercessor.id,
            beneficiaryId: owner.id,
            validation: { outcome: "accepted" },
          },
        ),
      ).toBe("allowed")
    },
    dbTestTimeout,
  )

  it(
    "beneficiário não lê oração em moderação; admin decide e libera",
    async () => {
      const owner = await createDbTestUser("Review Owner")
      const intercessor = await createDbTestUser("Review Intercessor")
      const admin = await createDbTestUser("Review Admin", "ADMIN")
      const request = await createDbTestRequest(owner.id, categoryId)
      const queued = await createQueuedPrayer({
        requestId: request.id,
        intercessorId: intercessor.id,
        beneficiaryId: owner.id,
        body: "Texto sinalizado para revisão humana objetiva.",
        outcome: "manual_review",
      })

      expect(
        getPrayerReadAccess(
          { id: owner.id, role: "USER" },
          {
            intercessorId: intercessor.id,
            beneficiaryId: owner.id,
            validation: { outcome: "manual_review" },
          },
        ),
      ).toBe("hidden")

      const decided = await decidePrayerValidation({
        prayerId: queued.id,
        actorUserId: admin.id,
        outcome: "accepted",
        rationale: "Sem abuso objetivo.",
      })
      expect(decided.prayer.validation?.outcome).toBe("accepted")
      expect(decided.eligibility.opened).toBe(true)

      expect(
        getPrayerReadAccess(
          { id: owner.id, role: "USER" },
          {
            intercessorId: intercessor.id,
            beneficiaryId: owner.id,
            validation: { outcome: "accepted" },
          },
        ),
      ).toBe("allowed")
    },
    dbTestTimeout,
  )

  it(
    "preserva elegibilidade já aberta e bloqueia texto insuficiente",
    async () => {
      const owner = await createDbTestUser("Preserve Owner")
      const intercessor = await createDbTestUser("Preserve Intercessor")
      const request = await createDbTestRequest(owner.id, categoryId)

      await submitPrayer({
        intercessorId: intercessor.id,
        requestId: request.id,
        body: "Primeira oração aceita automaticamente com cuidado real.",
        idempotencyKey: `pres1_${randomUUID().slice(0, 12)}`,
      })
      expect((await getRequestEligibilitySnapshot(intercessor.id)).canPublish).toBe(true)

      const second = await submitPrayer({
        intercessorId: intercessor.id,
        requestId: request.id,
        body: "Segunda oração também legítima sem acumular direito extra.",
        idempotencyKey: `pres2_${randomUUID().slice(0, 12)}`,
      })
      expect(second.prayer.validation?.outcome).toBe("accepted")
      const openCount = await prisma.requestEligibility.count({
        where: { userId: intercessor.id, status: "open" },
      })
      expect(openCount).toBe(1)

      await expect(
        submitPrayer({
          intercessorId: intercessor.id,
          requestId: request.id,
          body: "Amém",
          idempotencyKey: `trivial_${randomUUID().slice(0, 12)}`,
        }),
      ).rejects.toMatchObject({ code: "PRAYER_BODY_INSUFFICIENT", status: 422 })
    },
    dbTestTimeout,
  )

  it(
    "reprocessamento legado dry-run e apply idempotente em banco local",
    async () => {
      const owner = await createDbTestUser("Reprocess Owner")
      const intercessor = await createDbTestUser("Reprocess Intercessor")
      const request = await createDbTestRequest(owner.id, categoryId)
      const legacy = await createQueuedPrayer({
        requestId: request.id,
        intercessorId: intercessor.id,
        beneficiaryId: owner.id,
        body: "Senhor, fortalece esta pessoa na esperança e na paz.",
        outcome: "pending",
      })

      const dry = await reprocessLegacyPrayer({ prayerId: legacy.id })
      expect(dry.dryRun).toBe(true)
      expect(dry.applied).toBe(false)
      expect(dry.classification.outcome).toBe("accepted")
      expect(
        (
          await prisma.prayerValidation.findUniqueOrThrow({
            where: { prayerId: legacy.id },
          })
        ).outcome,
      ).toBe("pending")

      const applied = await reprocessLegacyPrayer({
        prayerId: legacy.id,
        apply: true,
        ownerAuthorization: "OWNER_AUTHORIZED",
      })
      expect(applied.applied).toBe(true)
      expect(applied.eligibility?.opened).toBe(true)

      const again = await reprocessLegacyPrayer({
        prayerId: legacy.id,
        apply: true,
        ownerAuthorization: "OWNER_AUTHORIZED",
      })
      expect(again.integrity.eligibleForReprocess).toBe(false)
    },
    dbTestTimeout,
  )
})
