import type { AgeBand, FeedPolicyDocument, PrayerCountBand } from "./types"

export type FeedCandidate = {
  id: string
  validPrayerCount: number
  rankedAt: Date
}

export type RankedFeedItem<T extends FeedCandidate> = T & {
  inPrimaryQueue: boolean
  prayerCountRank: number
  ageRank: number
  priorityHint: string | null
}

const FALLBACK_COUNT_BANDS: PrayerCountBand[] = [
  { min: 0, max: 0, priorityRank: 0 },
  { min: 1, max: 2, priorityRank: 1 },
  { min: 3, max: 5, priorityRank: 2 },
  { min: 6, max: null, priorityRank: 3 },
]

/**
 * Ordenação determinística do feed solidário.
 * Preferência: menos orações válidas → mais recente.
 * Faixas numéricas vêm da política quando ativa; senão usa fallback estrutural
 * (ainda sem pesos financeiros/popularidade).
 */
export function rankPrayerRequestsForFeed<T extends FeedCandidate>(
  items: T[],
  policy: FeedPolicyDocument | null,
  now: Date = new Date(),
): RankedFeedItem<T>[] {
  const countBands =
    policy?.prayerCountBands?.some((b) => b.priorityRank != null)
      ? policy.prayerCountBands
      : FALLBACK_COUNT_BANDS

  const ageBands =
    policy?.ageBandsHours?.some((b) => b.priorityRank != null || b.leavePrimaryQueue)
      ? policy.ageBandsHours
      : null

  const ranked = items.map((item) => {
    const ageHours = Math.max(0, (now.getTime() - item.rankedAt.getTime()) / 3_600_000)
    const prayerCountRank = resolveCountRank(item.validPrayerCount, countBands)
    const ageResolution = resolveAgeRank(ageHours, ageBands)
    const priorityHint = buildPriorityHint(item.validPrayerCount, ageHours, ageResolution)

    return {
      ...item,
      inPrimaryQueue: ageResolution.inPrimaryQueue,
      prayerCountRank,
      ageRank: ageResolution.rank,
      priorityHint,
    }
  })

  return ranked
    .filter((item) => item.inPrimaryQueue)
    .sort((a, b) => {
      if (a.prayerCountRank !== b.prayerCountRank) {
        return a.prayerCountRank - b.prayerCountRank
      }
      if (a.ageRank !== b.ageRank) return a.ageRank - b.ageRank
      return b.rankedAt.getTime() - a.rankedAt.getTime()
    })
}

function resolveCountRank(count: number, bands: PrayerCountBand[]): number {
  for (const band of bands) {
    const maxOk = band.max == null || count <= band.max
    if (count >= band.min && maxOk) {
      return band.priorityRank ?? Number.MAX_SAFE_INTEGER
    }
  }
  return Number.MAX_SAFE_INTEGER
}

function resolveAgeRank(
  ageHours: number,
  bands: AgeBand[] | null,
): { rank: number; inPrimaryQueue: boolean } {
  if (!bands || bands.length === 0) {
    return { rank: 0, inPrimaryQueue: true }
  }

  for (const band of bands) {
    const matches = band.maxAgeHours == null || ageHours <= band.maxAgeHours
    if (!matches) continue
    if (band.leavePrimaryQueue) {
      return { rank: band.priorityRank ?? Number.MAX_SAFE_INTEGER, inPrimaryQueue: false }
    }
    return {
      rank: band.priorityRank ?? 0,
      inPrimaryQueue: true,
    }
  }

  return { rank: Number.MAX_SAFE_INTEGER, inPrimaryQueue: true }
}

function buildPriorityHint(
  validPrayerCount: number,
  ageHours: number,
  age: { inPrimaryQueue: boolean },
): string | null {
  if (!age.inPrimaryQueue) return "fora da fila principal"
  if (validPrayerCount === 0) return "ainda sem orações"
  if (validPrayerCount <= 2) return "poucas orações"
  if (ageHours <= 72) return "pedido recente"
  return null
}

export function parseFeedPolicyDocument(raw: unknown): FeedPolicyDocument | null {
  if (!raw || typeof raw !== "object") return null
  const doc = raw as Partial<FeedPolicyDocument>
  if (!Array.isArray(doc.prayerCountBands) || !Array.isArray(doc.ageBandsHours)) {
    return null
  }
  return {
    note: typeof doc.note === "string" ? doc.note : undefined,
    hypotheses: Boolean(doc.hypotheses),
    prayerCountBands: doc.prayerCountBands as PrayerCountBand[],
    ageBandsHours: doc.ageBandsHours as AgeBand[],
  }
}
