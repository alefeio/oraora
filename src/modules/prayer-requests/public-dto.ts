import type {
  PublicCategoryDto,
  PublicIdentityMode,
  PublicPrayerRequestDto,
  PrayerRequestStatus,
  SafetyClass,
} from "./types"

type CategoryRow = {
  id: string
  slug: string
  name: string
  description: string | null
  sortOrder: number
  safetyClass: string
}

type RequestRow = {
  id: string
  title: string
  story: string
  prayerNeed: string
  publicIdentityMode: string
  publicLabel: string
  status: string
  validPrayerCount: number
  rankedAt: Date
  createdAt: Date
  isSyntheticFixture: boolean
  category: CategoryRow
}

/**
 * Serializa apenas campos públicos.
 * authorId / e-mail / nome civil NÃO entram neste objeto.
 */
export function toPublicPrayerRequestDto(
  row: RequestRow,
  feed?: { inPrimaryQueue: boolean; priorityHint: string | null },
): PublicPrayerRequestDto {
  return {
    id: row.id,
    title: row.title,
    story: row.story,
    prayerNeed: row.prayerNeed,
    publicIdentityMode: row.publicIdentityMode as PublicIdentityMode,
    publicLabel: row.publicLabel,
    status: row.status as PrayerRequestStatus,
    validPrayerCount: row.validPrayerCount,
    rankedAt: row.rankedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    isSyntheticFixture: row.isSyntheticFixture,
    category: {
      id: row.category.id,
      slug: row.category.slug,
      name: row.category.name,
      safetyClass: row.category.safetyClass as SafetyClass,
    },
    feed: feed
      ? {
          inPrimaryQueue: feed.inPrimaryQueue,
          priorityHint: feed.priorityHint,
        }
      : undefined,
  }
}

export function toPublicCategoryDto(row: CategoryRow): PublicCategoryDto {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    sortOrder: row.sortOrder,
    safetyClass: row.safetyClass as SafetyClass,
  }
}

export function summarizeStory(story: string, maxLength = 160): string {
  const normalized = story.replace(/\s+/g, " ").trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`
}
