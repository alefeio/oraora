import { prisma } from "@/lib/db/prisma"
import { getActivePolicy } from "@/lib/security/policies"
import { parseFeedPolicyDocument, rankPrayerRequestsForFeed } from "./feed-ranking"
import {
  categoriesFromPrimaryFeed,
  toPublicCategoryDto,
  toPublicPrayerRequestDto,
} from "./public-dto"
import type { PublicCategoryDto, PublicPrayerRequestDto } from "./types"

const readableStatuses = ["open", "paused", "closed"] as const

function isReadableStatus(status: string) {
  return (readableStatuses as readonly string[]).includes(status)
}

export async function listActiveCategories(): Promise<PublicCategoryDto[]> {
  const rows = await prisma.prayerRequestCategory.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  })
  return rows.map(toPublicCategoryDto)
}

export async function listFeedPrayerRequests(input?: {
  categorySlug?: string
  now?: Date
  viewerUserId?: string
}): Promise<PublicPrayerRequestDto[]> {
  const now = input?.now ?? new Date()

  const rows = await prisma.prayerRequest.findMany({
    where: {
      status: "open",
      contentVisibility: "authenticated",
      ...(input?.categorySlug
        ? { category: { slug: input.categorySlug, active: true } }
        : { category: { active: true } }),
    },
    include: {
      category: true,
    },
  })

  const policyRow = await getActivePolicy("feed")
  const policy = policyRow ? parseFeedPolicyDocument(policyRow.document) : null

  const ranked = rankPrayerRequestsForFeed(
    rows.map((row) => ({
      id: row.id,
      validPrayerCount: row.validPrayerCount,
      rankedAt: row.rankedAt,
      row,
    })),
    policy,
    now,
  )

  return ranked.map((item) =>
    toPublicPrayerRequestDto(item.row, {
      feed: {
        inPrimaryQueue: item.inPrimaryQueue,
        priorityHint: item.priorityHint,
      },
      viewerUserId: input?.viewerUserId,
    }),
  )
}

/**
 * Fila principal completa + categorias derivadas dela (mesmos critérios do ranking).
 */
export async function listFeedWithFilterCategories(input?: {
  now?: Date
  viewerUserId?: string
}): Promise<{
  requests: PublicPrayerRequestDto[]
  filterCategories: PublicCategoryDto[]
}> {
  const requests = await listFeedPrayerRequests({
    now: input?.now,
    viewerUserId: input?.viewerUserId,
  })
  return {
    requests,
    filterCategories: categoriesFromPrimaryFeed(requests),
  }
}

export async function getReadablePrayerRequestById(
  id: string,
  options?: { viewerUserId?: string },
): Promise<PublicPrayerRequestDto | null> {
  const row = await prisma.prayerRequest.findUnique({
    where: { id },
    include: { category: true },
  })

  if (!row) return null
  if (row.status === "removed") return null
  if (row.contentVisibility === "private" || row.contentVisibility === "restricted") {
    return null
  }
  if (row.contentVisibility !== "authenticated") return null
  if (!isReadableStatus(row.status)) return null
  if (!row.category.active && row.status === "open") {
    // categoria inativa: ainda permite leitura direta de pedido já conhecido? Spec: restricted/removed blocked.
    // Mantém leitura se status legível e visibility authenticated.
  }

  const policyRow = await getActivePolicy("feed")
  const policy = policyRow ? parseFeedPolicyDocument(policyRow.document) : null
  const [ranked] = rankPrayerRequestsForFeed(
    [
      {
        id: row.id,
        validPrayerCount: row.validPrayerCount,
        rankedAt: row.rankedAt,
      },
    ],
    policy,
  )

  return toPublicPrayerRequestDto(row, {
    feed: {
      inPrimaryQueue: ranked?.inPrimaryQueue ?? true,
      priorityHint: ranked?.priorityHint ?? null,
    },
    viewerUserId: options?.viewerUserId,
  })
}

export { categoriesFromPrimaryFeed }
