import { config as loadEnv } from "dotenv"
import { assertDatabaseWriteAllowed, redactDatabaseTarget } from "../src/lib/db/guards"
import { prisma } from "../src/lib/db/prisma"
import { seedCategoriesIdempotent } from "../src/modules/prayer-requests/categories"

loadEnv({ path: ".env.local", quiet: true })
loadEnv({ path: ".env", quiet: true })

/** Apenas referências — sem texto de traduções protegidas. */
const PASSAGES = [
  { referenceLabel: "Isaías 41:10", book: "Isaías", chapter: 41, verseStart: 10, topics: ["saude", "sofrimento"] },
  { referenceLabel: "Salmo 46:1", book: "Salmo", chapter: 46, verseStart: 1, topics: ["saude", "sofrimento"] },
  { referenceLabel: "Filipenses 4:6-7", book: "Filipenses", chapter: 4, verseStart: 6, verseEnd: 7, topics: ["sofrimento", "financas"] },
  { referenceLabel: "Salmo 34:18", book: "Salmo", chapter: 34, verseStart: 18, topics: ["luto", "sofrimento"] },
  { referenceLabel: "Romanos 12:12", book: "Romanos", chapter: 12, verseStart: 12, topics: ["familia", "relacionamentos"] },
  { referenceLabel: "Colossenses 3:23", book: "Colossenses", chapter: 3, verseStart: 23, topics: ["trabalho"] },
  { referenceLabel: "Mateus 6:33", book: "Mateus", chapter: 6, verseStart: 33, topics: ["financas", "espiritual"] },
  { referenceLabel: "Salmo 23:1", book: "Salmo", chapter: 23, verseStart: 1, topics: ["espiritual", "gratidao"] },
  { referenceLabel: "1 Tessalonicenses 5:18", book: "1 Tessalonicenses", chapter: 5, verseStart: 18, topics: ["gratidao"] },
  { referenceLabel: "Tiago 5:16", book: "Tiago", chapter: 5, verseStart: 16, topics: ["dependencia", "espiritual"] },
] as const

const TOPICS = [
  { slug: "saude", name: "Saúde", categorySlug: "saude" },
  { slug: "familia", name: "Família", categorySlug: "familia" },
  { slug: "relacionamentos", name: "Relacionamentos", categorySlug: "relacionamentos" },
  { slug: "trabalho", name: "Trabalho", categorySlug: "trabalho-desemprego" },
  { slug: "financas", name: "Finanças", categorySlug: "financas" },
  { slug: "dependencia", name: "Dependência", categorySlug: "dependencia" },
  { slug: "luto", name: "Luto", categorySlug: "luto" },
  { slug: "sofrimento", name: "Sofrimento", categorySlug: "sofrimento-emocional" },
  { slug: "espiritual", name: "Vida espiritual", categorySlug: "vida-espiritual" },
  { slug: "gratidao", name: "Gratidão", categorySlug: "gratidao" },
] as const

async function main() {
  const target = assertDatabaseWriteAllowed()
  console.info("seed target", redactDatabaseTarget(target))
  await seedCategoriesIdempotent()

  const categories = await prisma.prayerRequestCategory.findMany()
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]))

  for (const topic of TOPICS) {
    const row = await prisma.scriptureTopic.upsert({
      where: { slug: topic.slug },
      create: { slug: topic.slug, name: topic.name },
      update: { name: topic.name },
    })
    const category = categoryBySlug.get(topic.categorySlug)
    if (category) {
      await prisma.categoryScriptureTopic.upsert({
        where: {
          categoryId_topicId: { categoryId: category.id, topicId: row.id },
        },
        create: { categoryId: category.id, topicId: row.id },
        update: {},
      })
    }
  }

  const topics = await prisma.scriptureTopic.findMany()
  const topicBySlug = new Map(topics.map((t) => [t.slug, t]))

  for (const passage of PASSAGES) {
    const row = await prisma.scripturePassage.upsert({
      where: {
        referenceLabel_translationCode: {
          referenceLabel: passage.referenceLabel,
          translationCode: "",
        },
      },
      create: {
        referenceLabel: passage.referenceLabel,
        book: passage.book,
        chapter: passage.chapter,
        verseStart: passage.verseStart,
        verseEnd: "verseEnd" in passage ? passage.verseEnd ?? null : null,
        translationCode: "",
        licenseStatus: "reference_only",
        textBody: null,
        active: true,
      },
      update: {
        book: passage.book,
        chapter: passage.chapter,
        verseStart: passage.verseStart,
        licenseStatus: "reference_only",
        textBody: null,
        active: true,
      },
    })

    for (const topicSlug of passage.topics) {
      const topic = topicBySlug.get(topicSlug)
      if (!topic) continue
      await prisma.scripturePassageTopic.upsert({
        where: {
          passageId_topicId: { passageId: row.id, topicId: topic.id },
        },
        create: { passageId: row.id, topicId: topic.id },
        update: {},
      })
    }
  }

  console.info(`scripture passages upserted: ${PASSAGES.length}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
