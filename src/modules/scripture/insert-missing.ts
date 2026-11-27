import type { PrismaClient } from "@/generated/prisma/client"
import { SCRIPTURE_PASSAGES, SCRIPTURE_TOPICS } from "./catalog"

export type InsertMissingScriptureResult = {
  topicsCreated: number
  categoryLinksCreated: number
  passagesCreated: number
  passageTopicLinksCreated: number
  skippedExisting: {
    topics: number
    categoryLinks: number
    passages: number
    passageTopicLinks: number
  }
}

/**
 * Insere somente itens ausentes do catálogo oficial.
 * Não atualiza registros existentes e não chama seed de categorias.
 */
export async function insertMissingScriptureOnly(
  prisma: PrismaClient,
): Promise<InsertMissingScriptureResult> {
  const result: InsertMissingScriptureResult = {
    topicsCreated: 0,
    categoryLinksCreated: 0,
    passagesCreated: 0,
    passageTopicLinksCreated: 0,
    skippedExisting: {
      topics: 0,
      categoryLinks: 0,
      passages: 0,
      passageTopicLinks: 0,
    },
  }

  await prisma.$transaction(async (tx) => {
    const categories = await tx.prayerRequestCategory.findMany({
      select: { id: true, slug: true },
    })
    const categoryBySlug = new Map(categories.map((c) => [c.slug, c]))

    for (const topic of SCRIPTURE_TOPICS) {
      const existingTopic = await tx.scriptureTopic.findUnique({
        where: { slug: topic.slug },
      })
      let topicId: string
      if (existingTopic) {
        result.skippedExisting.topics += 1
        topicId = existingTopic.id
      } else {
        const created = await tx.scriptureTopic.create({
          data: { slug: topic.slug, name: topic.name },
        })
        topicId = created.id
        result.topicsCreated += 1
      }

      const category = categoryBySlug.get(topic.categorySlug)
      if (!category) continue

      const existingLink = await tx.categoryScriptureTopic.findUnique({
        where: {
          categoryId_topicId: { categoryId: category.id, topicId },
        },
      })
      if (existingLink) {
        result.skippedExisting.categoryLinks += 1
      } else {
        await tx.categoryScriptureTopic.create({
          data: { categoryId: category.id, topicId },
        })
        result.categoryLinksCreated += 1
      }
    }

    const topics = await tx.scriptureTopic.findMany({ select: { id: true, slug: true } })
    const topicBySlug = new Map(topics.map((t) => [t.slug, t]))

    for (const passage of SCRIPTURE_PASSAGES) {
      const existingPassage = await tx.scripturePassage.findUnique({
        where: {
          referenceLabel_translationCode: {
            referenceLabel: passage.referenceLabel,
            translationCode: "",
          },
        },
      })

      let passageId: string
      if (existingPassage) {
        result.skippedExisting.passages += 1
        passageId = existingPassage.id
      } else {
        const created = await tx.scripturePassage.create({
          data: {
            referenceLabel: passage.referenceLabel,
            book: passage.book,
            chapter: passage.chapter,
            verseStart: passage.verseStart,
            verseEnd: "verseEnd" in passage ? (passage.verseEnd ?? null) : null,
            translationCode: "",
            licenseStatus: "reference_only",
            textBody: null,
            active: true,
          },
        })
        passageId = created.id
        result.passagesCreated += 1
      }

      for (const topicSlug of passage.topics) {
        const topic = topicBySlug.get(topicSlug)
        if (!topic) continue
        const existingJoin = await tx.scripturePassageTopic.findUnique({
          where: {
            passageId_topicId: { passageId, topicId: topic.id },
          },
        })
        if (existingJoin) {
          result.skippedExisting.passageTopicLinks += 1
        } else {
          await tx.scripturePassageTopic.create({
            data: { passageId, topicId: topic.id },
          })
          result.passageTopicLinksCreated += 1
        }
      }
    }
  })

  return result
}
