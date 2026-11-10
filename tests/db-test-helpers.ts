import { randomUUID } from "node:crypto"
import { prisma } from "@/lib/db/prisma"
import { seedCategoriesIdempotent } from "@/modules/prayer-requests/categories"

export const dbTestTimeout = 45_000

export async function createDbTestUser(label: string, role = "USER", banned = false) {
  const suffix = randomUUID().replace(/-/g, "").slice(0, 12)
  return prisma.user.create({
    data: {
      id: randomUUID().replace(/-/g, ""),
      name: label,
      email: `${label.toLowerCase().replace(/\s+/g, ".")}.${suffix}@test.local`,
      emailVerified: true,
      role,
      banned,
    },
  })
}

export async function getDbTestCategoryId() {
  await seedCategoriesIdempotent()
  const category = await prisma.prayerRequestCategory.findFirstOrThrow({
    where: { slug: "outros" },
  })
  return category.id
}

export async function createDbTestRequest(authorId: string, categoryId: string) {
  return prisma.prayerRequest.create({
    data: {
      authorId,
      categoryId,
      title: `[TESTE] ${randomUUID()}`,
      story: "Fixture de integração",
      prayerNeed: "Pedido de teste",
      publicIdentityMode: "anonymous",
      publicLabel: "Anônimo",
      contentVisibility: "authenticated",
      status: "open",
      isSyntheticFixture: true,
      fixtureKey: `hardening-${randomUUID()}`,
    },
  })
}
