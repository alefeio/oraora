import { prisma } from "@/lib/db/prisma"

export type ScriptureSuggestionDto = {
  id: string
  referenceLabel: string
  book: string
  licenseStatus: string
  textBody: string | null
  topic: string | null
}

/** Sugestões por categoria. Sem texto se licenseStatus = reference_only. */
export async function listScriptureSuggestions(input?: {
  categoryId?: string
  categorySlug?: string
}): Promise<ScriptureSuggestionDto[]> {
  let categoryId = input?.categoryId
  if (!categoryId && input?.categorySlug) {
    const category = await prisma.prayerRequestCategory.findUnique({
      where: { slug: input.categorySlug },
    })
    categoryId = category?.id
  }

  if (!categoryId) {
    const passages = await prisma.scripturePassage.findMany({
      where: { active: true },
      orderBy: { referenceLabel: "asc" },
      take: 20,
    })
    return passages.map((p) => ({
      id: p.id,
      referenceLabel: p.referenceLabel,
      book: p.book,
      licenseStatus: p.licenseStatus,
      textBody: p.licenseStatus === "reference_only" ? null : p.textBody,
      topic: null,
    }))
  }

  const links = await prisma.categoryScriptureTopic.findMany({
    where: { categoryId },
    include: {
      topic: {
        include: {
          passages: {
            include: { passage: true },
          },
        },
      },
    },
  })

  const seen = new Set<string>()
  const suggestions: ScriptureSuggestionDto[] = []
  for (const link of links) {
    for (const join of link.topic.passages) {
      const p = join.passage
      if (!p.active || seen.has(p.id)) continue
      seen.add(p.id)
      suggestions.push({
        id: p.id,
        referenceLabel: p.referenceLabel,
        book: p.book,
        licenseStatus: p.licenseStatus,
        textBody: p.licenseStatus === "reference_only" ? null : p.textBody,
        topic: link.topic.name,
      })
    }
  }

  return suggestions
}
