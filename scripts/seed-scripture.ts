import { config as loadEnv } from "dotenv"
import { assertDatabaseWriteAllowed, redactDatabaseTarget } from "../src/lib/db/guards"
import { prisma } from "../src/lib/db/prisma"
import { seedCategoriesIdempotent } from "../src/modules/prayer-requests/categories"
import { SCRIPTURE_PASSAGES, SCRIPTURE_TOPICS } from "../src/modules/scripture/catalog"

loadEnv({ path: ".env.local", quiet: true })
loadEnv({ path: ".env", quiet: true })

async function main() {
  const target = assertDatabaseWriteAllowed()
  console.info("seed target", redactDatabaseTarget(target))
  await seedCategoriesIdempotent()

  const categories = await prisma.prayerRequestCategory.findMany()
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]))

  for (const topic of SCRIPTURE_TOPICS) {
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

  for (const passage of SCRIPTURE_PASSAGES) {
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

  console.info(`scripture passages upserted: ${SCRIPTURE_PASSAGES.length}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
