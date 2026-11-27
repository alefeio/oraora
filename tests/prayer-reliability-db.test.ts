import { randomUUID } from "node:crypto"
import { beforeAll, describe, expect, it } from "vitest"
import { prisma } from "@/lib/db/prisma"
import { reconcilePrayerSubmission } from "@/modules/intercession/reconcile-submission"
import { submitPrayer } from "@/modules/intercession/submit-prayer"
import { insertMissingScriptureOnly } from "@/modules/scripture/insert-missing"
import { listScriptureSuggestions } from "@/modules/scripture/suggestions"
import {
  createDbTestRequest,
  createDbTestUser,
  dbTestTimeout,
  getDbTestCategoryId,
} from "./db-test-helpers"

const enabled = process.env.RUN_DB_TESTS === "1"

describe.runIf(enabled)("UI-05D.1 prayer reliability + scripture", () => {
  let categoryId = ""

  beforeAll(async () => {
    categoryId = await getDbTestCategoryId()
  }, dbTestTimeout)

  it(
    "envia oração, bloqueia duplo clique lógico e reconcilia por chave",
    async () => {
      const owner = await createDbTestUser("Reliability Owner")
      const intercessor = await createDbTestUser("Reliability Intercessor")
      const request = await createDbTestRequest(owner.id, categoryId)
      const key = `rel_${randomUUID().slice(0, 12)}`
      const body = "Oração de confiabilidade local."

      const first = await submitPrayer({
        intercessorId: intercessor.id,
        requestId: request.id,
        body,
        idempotencyKey: key,
      })
      const replay = await submitPrayer({
        intercessorId: intercessor.id,
        requestId: request.id,
        body,
        idempotencyKey: key,
      })
      const reconciled = await reconcilePrayerSubmission({
        intercessorId: intercessor.id,
        idempotencyKey: key,
      })

      expect(first.reused).toBe(false)
      expect(replay.reused).toBe(true)
      expect(replay.prayer.id).toBe(first.prayer.id)
      expect(reconciled.status).toBe("found")
      if (reconciled.status === "found") {
        expect(reconciled.prayer.id).toBe(first.prayer.id)
      }
    },
    dbTestTimeout,
  )

  it(
    "trata mudança de passagem na mesma chave como conflito de idempotência",
    async () => {
      const owner = await createDbTestUser("Scripture Idem Owner")
      const intercessor = await createDbTestUser("Scripture Idem Intercessor")
      const request = await createDbTestRequest(owner.id, categoryId)
      await insertMissingScriptureOnly(prisma)
      const passages = await prisma.scripturePassage.findMany({
        where: { active: true },
        take: 2,
        orderBy: { referenceLabel: "asc" },
      })
      expect(passages.length).toBeGreaterThanOrEqual(2)

      const key = `scr_${randomUUID().slice(0, 12)}`
      const body = "Oração com passagem selecionada."
      await submitPrayer({
        intercessorId: intercessor.id,
        requestId: request.id,
        body,
        scripturePassageId: passages[0]!.id,
        idempotencyKey: key,
      })

      await expect(
        submitPrayer({
          intercessorId: intercessor.id,
          requestId: request.id,
          body,
          scripturePassageId: passages[1]!.id,
          idempotencyKey: key,
        }),
      ).rejects.toMatchObject({ code: "IDEMPOTENCY_PAYLOAD_CONFLICT", status: 409 })
    },
    dbTestTimeout,
  )

  it(
    "bloqueia auto-oração e conta não autorizada (banida)",
    async () => {
      const owner = await createDbTestUser("Self Prayer Owner")
      const banned = await createDbTestUser("Banned Intercessor", "USER", true)
      const request = await createDbTestRequest(owner.id, categoryId)

      await expect(
        submitPrayer({
          intercessorId: owner.id,
          requestId: request.id,
          body: "Não deveria orar pelo próprio pedido.",
          idempotencyKey: `self_${randomUUID().slice(0, 12)}`,
        }),
      ).rejects.toMatchObject({ code: "SELF_PRAYER_FORBIDDEN" })

      await expect(
        submitPrayer({
          intercessorId: banned.id,
          requestId: request.id,
          body: "Conta banida não ora.",
          idempotencyKey: `ban_${randomUUID().slice(0, 12)}`,
        }),
      ).rejects.toMatchObject({ code: "ACCOUNT_SUSPENDED" })
    },
    dbTestTimeout,
  )

  it(
    "insere scripture ausente e permite orar sem sugestões",
    async () => {
      const first = await insertMissingScriptureOnly(prisma)
      const second = await insertMissingScriptureOnly(prisma)
      expect(first.passagesCreated + first.topicsCreated).toBeGreaterThanOrEqual(0)
      expect(second.passagesCreated).toBe(0)
      expect(second.topicsCreated).toBe(0)

      const gratidao = await listScriptureSuggestions({ categorySlug: "gratidao" })
      expect(gratidao.length).toBeGreaterThan(0)

      const owner = await createDbTestUser("No Suggestion Owner")
      const intercessor = await createDbTestUser("No Suggestion Intercessor")
      const request = await createDbTestRequest(owner.id, categoryId)
      const result = await submitPrayer({
        intercessorId: intercessor.id,
        requestId: request.id,
        body: "Oração sem passagem selecionada.",
        scripturePassageId: null,
        idempotencyKey: `nosug_${randomUUID().slice(0, 12)}`,
      })
      expect(result.prayer.id).toBeTruthy()
      expect(result.prayer.scripture).toBeNull()
    },
    dbTestTimeout,
  )

  it(
    "reconciliação de chave inexistente retorna not_found",
    async () => {
      const user = await createDbTestUser("Reconcile Missing")
      const result = await reconcilePrayerSubmission({
        intercessorId: user.id,
        idempotencyKey: `missing_${randomUUID().slice(0, 12)}`,
      })
      expect(result.status).toBe("not_found")
    },
    dbTestTimeout,
  )
})
