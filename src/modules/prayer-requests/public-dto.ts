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
  /** Uso interno de comparação — nunca serializado no DTO. */
  authorId?: string
}

export type PublicPrayerRequestDtoOptions = {
  feed?: { inPrimaryQueue: boolean; priorityHint: string | null }
  /** ID do usuário autenticado no servidor; nunca espelhado no DTO. */
  viewerUserId?: string
}

/**
 * Serializa apenas campos públicos.
 * authorId / e-mail / nome civil NÃO entram neste objeto.
 */
export function toPublicPrayerRequestDto(
  row: RequestRow,
  options?: PublicPrayerRequestDtoOptions,
): PublicPrayerRequestDto {
  const viewerIsAuthor = Boolean(
    options?.viewerUserId && row.authorId && options.viewerUserId === row.authorId,
  )

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
      sortOrder: row.category.sortOrder,
      safetyClass: row.category.safetyClass as SafetyClass,
    },
    feed: options?.feed
      ? {
          inPrimaryQueue: options.feed.inPrimaryQueue,
          priorityHint: options.feed.priorityHint,
        }
      : undefined,
    ...(viewerIsAuthor ? { viewerIsAuthor: true } : {}),
  }
}

/**
 * Categorias presentes na fila principal já ranqueada, ordenadas por sortOrder/nome.
 */
export function categoriesFromPrimaryFeed(
  requests: PublicPrayerRequestDto[],
): PublicCategoryDto[] {
  const bySlug = new Map<string, PublicCategoryDto>()
  for (const request of requests) {
    if (bySlug.has(request.category.slug)) continue
    bySlug.set(request.category.slug, {
      id: request.category.id,
      slug: request.category.slug,
      name: request.category.name,
      description: null,
      sortOrder: request.category.sortOrder,
      safetyClass: request.category.safetyClass,
    })
  }
  return [...bySlug.values()].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
    return a.name.localeCompare(b.name, "pt")
  })
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
