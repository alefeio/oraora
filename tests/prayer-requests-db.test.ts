import { beforeAll, describe, expect, it } from "vitest"
import { prisma } from "@/lib/db/prisma"
import { seedCategoriesIdempotent } from "@/modules/prayer-requests/categories"
import {
  getReadablePrayerRequestById,
  listFeedPrayerRequests,
} from "@/modules/prayer-requests/queries"

const enabled = process.env.RUN_DB_TESTS === "1"

describe.runIf(enabled)("prayer requests database", () => {
  beforeAll(async () => {
    await seedCategoriesIdempotent()
  })

  it("seed de categorias é idempotente", async () => {
    const first = await seedCategoriesIdempotent()
    const second = await seedCategoriesIdempotent()
    expect(first).toHaveLength(11)
    expect(second).toHaveLength(11)
    const count = await prisma.prayerRequestCategory.count()
    expect(count).toBe(11)
  })

  it("feed não devolve authorId", async () => {
    const feed = await listFeedPrayerRequests()
    const payload = JSON.stringify(feed)
    expect(payload).not.toMatch(/authorId/)
    expect(payload).not.toMatch(/@intercessao\.test/)
  })

  it("pedido removed/restricted não é legível", async () => {
    const removed = await prisma.prayerRequest.findFirst({
      where: { status: "removed" },
      select: { id: true },
    })
    if (removed) {
      expect(await getReadablePrayerRequestById(removed.id)).toBeNull()
    }

    const any = await prisma.prayerRequest.findFirst({
      where: { isSyntheticFixture: true, status: "open" },
    })
    if (!any) return

    await prisma.prayerRequest.update({
      where: { id: any.id },
      data: { contentVisibility: "restricted" },
    })
    expect(await getReadablePrayerRequestById(any.id)).toBeNull()

    await prisma.prayerRequest.update({
      where: { id: any.id },
      data: { contentVisibility: "authenticated" },
    })
  })
})
