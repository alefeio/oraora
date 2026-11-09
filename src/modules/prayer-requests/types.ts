export const PUBLIC_IDENTITY_MODES = [
  "full_name",
  "given_name",
  "initials",
  "anonymous",
] as const

export type PublicIdentityMode = (typeof PUBLIC_IDENTITY_MODES)[number]

export const CONTENT_VISIBILITIES = ["authenticated", "restricted", "private"] as const
export type ContentVisibility = (typeof CONTENT_VISIBILITIES)[number]

export const PRAYER_REQUEST_STATUSES = ["open", "paused", "closed", "removed"] as const
export type PrayerRequestStatus = (typeof PRAYER_REQUEST_STATUSES)[number]

export const SAFETY_CLASSES = [
  "none",
  "health",
  "emotional_crisis",
  "grief",
  "addiction",
  "violence",
  "finance",
] as const

export type SafetyClass = (typeof SAFETY_CLASSES)[number]

export type PrayerCountBand = {
  min: number
  max: number | null
  /** Ordem relativa: menor = mais prioritário. Hipótese configurável. */
  priorityRank: number | null
}

export type AgeBand = {
  maxAgeHours: number | null
  priorityRank: number | null
  leavePrimaryQueue?: boolean
}

export type FeedPolicyDocument = {
  note?: string
  hypotheses?: boolean
  prayerCountBands: PrayerCountBand[]
  ageBandsHours: AgeBand[]
}

/** DTO público — nunca inclui authorId, e-mail, nome civil ou contatos. */
export type PublicPrayerRequestDto = {
  id: string
  title: string
  story: string
  prayerNeed: string
  publicIdentityMode: PublicIdentityMode
  publicLabel: string
  status: PrayerRequestStatus
  validPrayerCount: number
  rankedAt: string
  createdAt: string
  isSyntheticFixture: boolean
  category: {
    id: string
    slug: string
    name: string
    safetyClass: SafetyClass
  }
  feed?: {
    inPrimaryQueue: boolean
    priorityHint: string | null
  }
}

export type PublicCategoryDto = {
  id: string
  slug: string
  name: string
  description: string | null
  sortOrder: number
  safetyClass: SafetyClass
}
