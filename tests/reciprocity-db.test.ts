import { randomUUID } from "node:crypto"
import { beforeAll, describe, expect, it } from "vitest"
import { prisma } from "@/lib/db/prisma"
import { seedCategoriesIdempotent } from "@/modules/prayer-requests/categories"
import { createPrayerRequest } from "@/modules/prayer-requests/create-request"
import { submitPrayer } from "@/modules/intercession/submit-prayer"
import { decidePrayerValidation } from "@/modules/intercession/validate-prayer"
import { getRequestEligibilitySnapshot } from "@/modules/reciprocity"
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

describe.runIf(enabled)("reciprocity database", () => {
  let categoryId = ""
  let adminId = ""

  beforeAll(async () => {
    await seedCategoriesIdempotent()
    const category = await prisma.prayerRequestCategory.findFirstOrThrow({
      where: { slug: "outros" },
    })
    categoryId = category.id
    const admin = await createUser("Admin Reciprocity", "ADMIN")
    adminId = admin.id
  }, timeout)

  it(
    "sem oração válida não publica; aprovação libera uma vez; consumo impede segunda",
    async () => {
      const author = await createUser("Author Seed")
      const intercessor = await createUser("Intercessor A")

      const target = await prisma.prayerRequest.create({
        data: {
          authorId: author.id,
          categoryId,
          title: "[TESTE] alvo reciprocidade",
          story: "Fixture",
          prayerNeed: "Teste",
          publicIdentityMode: "anonymous",
          publicLabel: "Anônimo",
          contentVisibility: "authenticated",
          status: "open",
          isSyntheticFixture: true,
          fixtureKey: `recip-${randomUUID()}`,
        },
      })

      await expect(
        createPrayerRequest({
          authorId: intercessor.id,
          categoryId,
          title: "Não deveria",
          story: "x",
          prayerNeed: "y",
          publicIdentityMode: "anonymous",
          publicLabel: "Anônimo",
          idempotencyKey: `noelig_${randomUUID().slice(0, 8)}`,
        }),
      ).rejects.toBeInstanceOf(EligibilityRequiredError)

      const submitted = await submitPrayer({
        intercessorId: intercessor.id,
        requestId: target.id,
        body: "Senhor, cuida desta pessoa com misericórdia e paz.",
        idempotencyKey: `pray_${randomUUID().slice(0, 12)}`,
      })
      expect(submitted.prayer.validation?.outcome).toBe("pending")

      const snapPending = await getRequestEligibilitySnapshot(intercessor.id)
      expect(snapPending.canPublish).toBe(false)

      await decidePrayerValidation({
        prayerId: submitted.prayer.id,
        actorUserId: adminId,
        outcome: "accepted",
      })

      const snapOpen = await getRequestEligibilitySnapshot(intercessor.id)
      expect(snapOpen.canPublish).toBe(true)

      const published = await createPrayerRequest({
        authorId: intercessor.id,
        categoryId,
        title: "Meu pedido após cuidar",
        story: "História real do teste",
        prayerNeed: "Preciso de oração",
        publicIdentityMode: "given_name",
        publicLabel: "João",
        idempotencyKey: `pub_${randomUUID().slice(0, 12)}`,
      })
      expect(published.prayerRequest.id).toBeTruthy()

      const snapAfter = await getRequestEligibilitySnapshot(intercessor.id)
      expect(snapAfter.canPublish).toBe(false)

      await expect(
        createPrayerRequest({
          authorId: intercessor.id,
          categoryId,
          title: "Segundo",
          story: "x",
          prayerNeed: "y",
          publicIdentityMode: "anonymous",
          publicLabel: "Anônimo",
          idempotencyKey: `pub2_${randomUUID().slice(0, 12)}`,
        }),
      ).rejects.toBeInstanceOf(EligibilityRequiredError)
    },
    timeout,
  )

  it(
    "orações extras e aprovação tardia não acumulam direitos",
    async () => {
      const author = await createUser("Author Late")
      const joao = await createUser("Joao Late")

      const target = await prisma.prayerRequest.create({
        data: {
          authorId: author.id,
          categoryId,
          title: "[TESTE] late validation",
          story: "Fixture",
          prayerNeed: "Teste",
          publicIdentityMode: "anonymous",
          publicLabel: "Anônimo",
          contentVisibility: "authenticated",
          status: "open",
          isSyntheticFixture: true,
          fixtureKey: `late-${randomUUID()}`,
        },
      })

      const p1 = await submitPrayer({
        intercessorId: joao.id,
        requestId: target.id,
        body: "Primeira oração individual e cuidadosa pelo pedido.",
        idempotencyKey: `late1_${randomUUID().slice(0, 10)}`,
      })
      const p2 = await submitPrayer({
        intercessorId: joao.id,
        requestId: target.id,
        body: "Segunda oração individual e cuidadosa pelo pedido.",
        idempotencyKey: `late2_${randomUUID().slice(0, 10)}`,
      })
      const p3 = await submitPrayer({
        intercessorId: joao.id,
        requestId: target.id,
        body: "Terceira oração individual e cuidadosa pelo pedido.",
        idempotencyKey: `late3_${randomUUID().slice(0, 10)}`,
      })

      await decidePrayerValidation({
        prayerId: p1.prayer.id,
        actorUserId: adminId,
        outcome: "accepted",
      })
      expect((await getRequestEligibilitySnapshot(joao.id)).canPublish).toBe(true)

      const second = await decidePrayerValidation({
        prayerId: p2.prayer.id,
        actorUserId: adminId,
        outcome: "accepted",
      })
      expect(second.eligibility.opened).toBe(false)
      expect(second.eligibility.reason).toBe("already_open")

      await createPrayerRequest({
        authorId: joao.id,
        categoryId,
        title: "Pedido do João",
        story: "Após cuidar",
        prayerNeed: "Ajuda",
        publicIdentityMode: "anonymous",
        publicLabel: "Anônimo",
        idempotencyKey: `latepub_${randomUUID().slice(0, 10)}`,
      })

      const late = await decidePrayerValidation({
        prayerId: p3.prayer.id,
        actorUserId: adminId,
        outcome: "accepted",
      })
      expect(late.eligibility.opened).toBe(false)
      expect(late.eligibility.reason).toBe("late_validation_after_publish")
      expect((await getRequestEligibilitySnapshot(joao.id)).canPublish).toBe(false)

      const p4 = await submitPrayer({
        intercessorId: joao.id,
        requestId: target.id,
        body: "Nova oração após publicar meu pedido anterior.",
        idempotencyKey: `late4_${randomUUID().slice(0, 10)}`,
      })
      const again = await decidePrayerValidation({
        prayerId: p4.prayer.id,
        actorUserId: adminId,
        outcome: "accepted",
      })
      expect(again.eligibility.opened).toBe(true)
      expect((await getRequestEligibilitySnapshot(joao.id)).canPublish).toBe(true)
    },
    timeout,
  )

  it(
    "concorrência: duas publicações simultâneas não consomem duas vezes",
    async () => {
      const author = await createUser("Author Race")
      const user = await createUser("Racer")
      const target = await prisma.prayerRequest.create({
        data: {
          authorId: author.id,
          categoryId,
          title: "[TESTE] race",
          story: "Fixture",
          prayerNeed: "Teste",
          publicIdentityMode: "anonymous",
          publicLabel: "Anônimo",
          contentVisibility: "authenticated",
          status: "open",
          isSyntheticFixture: true,
          fixtureKey: `race-${randomUUID()}`,
        },
      })

      const prayer = await submitPrayer({
        intercessorId: user.id,
        requestId: target.id,
        body: "Oração para teste de concorrência com cuidado.",
        idempotencyKey: `racepray_${randomUUID().slice(0, 10)}`,
      })
      await decidePrayerValidation({
        prayerId: prayer.prayer.id,
        actorUserId: adminId,
        outcome: "accepted",
      })

      const attempts = await Promise.allSettled([
        createPrayerRequest({
          authorId: user.id,
          categoryId,
          title: "Pedido A",
          story: "A",
          prayerNeed: "A",
          publicIdentityMode: "anonymous",
          publicLabel: "Anônimo",
          idempotencyKey: `raceA_${randomUUID().slice(0, 10)}`,
        }),
        createPrayerRequest({
          authorId: user.id,
          categoryId,
          title: "Pedido B",
          story: "B",
          prayerNeed: "B",
          publicIdentityMode: "anonymous",
          publicLabel: "Anônimo",
          idempotencyKey: `raceB_${randomUUID().slice(0, 10)}`,
        }),
      ])

      const ok = attempts.filter((a) => a.status === "fulfilled")
      const fail = attempts.filter((a) => a.status === "rejected")
      expect(ok).toHaveLength(1)
      expect(fail).toHaveLength(1)

      const consumed = await prisma.requestEligibility.count({
        where: { userId: user.id, status: "consumed" },
      })
      expect(consumed).toBe(1)
      const open = await prisma.requestEligibility.count({
        where: { userId: user.id, status: "open" },
      })
      expect(open).toBe(0)

      const published = await prisma.prayerRequest.count({
        where: { authorId: user.id, isSyntheticFixture: false },
      })
      expect(published).toBe(1)
    },
    timeout,
  )

  it(
    "idempotência de oração e auto-oração bloqueada; feedCount só após aceite",
    async () => {
      const author = await createUser("Author Idem")
      const user = await createUser("Idem User")
      const target = await prisma.prayerRequest.create({
        data: {
          authorId: author.id,
          categoryId,
          title: "[TESTE] idem",
          story: "Fixture",
          prayerNeed: "Teste",
          publicIdentityMode: "anonymous",
          publicLabel: "Anônimo",
          contentVisibility: "authenticated",
          status: "open",
          isSyntheticFixture: true,
          fixtureKey: `idem-${randomUUID()}`,
          validPrayerCount: 0,
        },
      })

      const key = `idemkey_${randomUUID().slice(0, 10)}`
      const first = await submitPrayer({
        intercessorId: user.id,
        requestId: target.id,
        body: "Oração idempotente com conteúdo real.",
        idempotencyKey: key,
      })
      const second = await submitPrayer({
        intercessorId: user.id,
        requestId: target.id,
        body: "Oração idempotente com conteúdo real.",
        idempotencyKey: key,
      })
      expect(second.reused).toBe(true)
      expect(second.prayer.id).toBe(first.prayer.id)

      await expect(
        submitPrayer({
          intercessorId: author.id,
          requestId: target.id,
          body: "Tentativa no próprio pedido.",
          idempotencyKey: `self_${randomUUID().slice(0, 10)}`,
        }),
      ).rejects.toMatchObject({ code: "SELF_PRAYER_FORBIDDEN" })

      const before = await prisma.prayerRequest.findUniqueOrThrow({ where: { id: target.id } })
      expect(before.validPrayerCount).toBe(0)

      await decidePrayerValidation({
        prayerId: first.prayer.id,
        actorUserId: adminId,
        outcome: "accepted",
      })
      const after = await prisma.prayerRequest.findUniqueOrThrow({ where: { id: target.id } })
      expect(after.validPrayerCount).toBe(1)
    },
    timeout,
  )
})
