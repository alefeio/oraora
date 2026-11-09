/**
 * Bounded context: Prayer Requests
 * Sprint 1: leitura autenticada, categorias, feed solidário e bloqueio de criação.
 */
export const PRAYER_REQUESTS_CONTEXT = "prayer-requests" as const

export {
  assertCanCreatePrayerRequest,
  PrayerRequestCreationBlockedError,
} from "./creation-guard"
export { listActiveCategories, listFeedPrayerRequests, getReadablePrayerRequestById } from "./queries"
export { rankPrayerRequestsForFeed, parseFeedPolicyDocument } from "./feed-ranking"
export { toPublicPrayerRequestDto, toPublicCategoryDto, summarizeStory } from "./public-dto"
export { INITIAL_CATEGORIES, seedCategoriesIdempotent } from "./categories"
export type {
  PublicPrayerRequestDto,
  PublicCategoryDto,
  FeedPolicyDocument,
  PublicIdentityMode,
} from "./types"
