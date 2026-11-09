import { randomUUID } from "node:crypto"
import { config as loadEnv } from "dotenv"
import { assertDatabaseWriteAllowed, redactDatabaseTarget } from "../src/lib/db/guards"
import { prisma } from "../src/lib/db/prisma"
import { seedCategoriesIdempotent } from "../src/modules/prayer-requests/categories"

loadEnv({ path: ".env.local", quiet: true })
loadEnv({ path: ".env", quiet: true })

const FIXTURE_AUTHOR_EMAIL = "fixtures.local@intercessao.test"

/**
 * Pedidos sintéticos para ambiente local/descartável.
 * NÃO são relatos reais. NÃO usar em produção.
 */
const FIXTURES = [
  {
    fixtureKey: "synth-gratitude-0",
    categorySlug: "gratidao",
    title: "[TESTE] Pedido sintético de gratidão",
    story:
      "Fixture de desenvolvimento para validar o feed. Este texto não descreve uma pessoa real.",
    prayerNeed: "Que a equipe possa testar a descoberta de pedidos com segurança.",
    publicIdentityMode: "anonymous",
    publicLabel: "Anônimo",
    validPrayerCount: 0,
    rankedHoursAgo: 6,
  },
  {
    fixtureKey: "synth-work-1",
    categorySlug: "trabalho-desemprego",
    title: "[TESTE] Pedido sintético sobre trabalho",
    story:
      "Fixture sintética para ordenação do feed. Conteúdo fictício de ambiente controlado.",
    prayerNeed: "Validar a prioridade de pedidos com poucas orações.",
    publicIdentityMode: "given_name",
    publicLabel: "Alex",
    validPrayerCount: 1,
    rankedHoursAgo: 24,
  },
  {
    fixtureKey: "synth-family-4",
    categorySlug: "familia",
    title: "[TESTE] Pedido sintético sobre família",
    story: "Fixture sintética intermediária. Sem dados pessoais reais.",
    prayerNeed: "Exercitar a faixa de prioridade normal do feed.",
    publicIdentityMode: "initials",
    publicLabel: "M. S.",
    validPrayerCount: 4,
    rankedHoursAgo: 96,
  },
  {
    fixtureKey: "synth-spiritual-8",
    categorySlug: "vida-espiritual",
    title: "[TESTE] Pedido sintético espiritual",
    story: "Fixture sintética com mais orações simuladas na contagem.",
    prayerNeed: "Verificar decaimento relativo na ordenação.",
    publicIdentityMode: "full_name",
    publicLabel: "Fixture Demonstração",
    validPrayerCount: 8,
    rankedHoursAgo: 30,
  },
  {
    fixtureKey: "synth-old-0",
    categorySlug: "outros",
    title: "[TESTE] Pedido sintético antigo",
    story: "Fixture antiga para testar saída da fila principal quando a política temporal estiver ativa.",
    prayerNeed: "Validar leavePrimaryQueue da política de feed.",
    publicIdentityMode: "anonymous",
    publicLabel: "Anônimo",
    validPrayerCount: 0,
    rankedHoursAgo: 200,
  },
] as const

async function ensureFixtureAuthor() {
  const existing = await prisma.user.findUnique({ where: { email: FIXTURE_AUTHOR_EMAIL } })
  if (existing) return existing

  return prisma.user.create({
    data: {
      id: randomUUID().replace(/-/g, ""),
      name: "Fixture Local",
      email: FIXTURE_AUTHOR_EMAIL,
      emailVerified: true,
      role: "USER",
    },
  })
}

async function main() {
  if (process.env.DATABASE_ENV === "production" || process.env.VERCEL_ENV === "production") {
    throw new Error("Fixtures sintéticas são proibidas em produção.")
  }

  const target = assertDatabaseWriteAllowed()
  if (!target.local) {
    throw new Error("Fixtures sintéticas só podem ser gravadas em host local.")
  }

  console.info("seed target", redactDatabaseTarget(target))
  await seedCategoriesIdempotent()
  const author = await ensureFixtureAuthor()
  const categories = await prisma.prayerRequestCategory.findMany()
  const bySlug = new Map(categories.map((c) => [c.slug, c]))

  for (const fixture of FIXTURES) {
    const category = bySlug.get(fixture.categorySlug)
    if (!category) throw new Error(`Categoria ausente: ${fixture.categorySlug}`)

    const rankedAt = new Date(Date.now() - fixture.rankedHoursAgo * 3_600_000)

    await prisma.prayerRequest.upsert({
      where: { fixtureKey: fixture.fixtureKey },
      create: {
        authorId: author.id,
        categoryId: category.id,
        title: fixture.title,
        story: fixture.story,
        prayerNeed: fixture.prayerNeed,
        publicIdentityMode: fixture.publicIdentityMode,
        publicLabel: fixture.publicLabel,
        contentVisibility: "authenticated",
        status: "open",
        validPrayerCount: fixture.validPrayerCount,
        rankedAt,
        isSyntheticFixture: true,
        fixtureKey: fixture.fixtureKey,
      },
      update: {
        title: fixture.title,
        story: fixture.story,
        prayerNeed: fixture.prayerNeed,
        publicIdentityMode: fixture.publicIdentityMode,
        publicLabel: fixture.publicLabel,
        validPrayerCount: fixture.validPrayerCount,
        rankedAt,
        isSyntheticFixture: true,
        status: "open",
        contentVisibility: "authenticated",
        categoryId: category.id,
      },
    })
  }

  console.info(`synthetic fixtures upserted: ${FIXTURES.length}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
