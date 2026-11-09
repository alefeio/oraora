/**
 * Bounded context: Prayer Requests
 * Sprint 2: leitura + criação protegida por reciprocidade.
 */
export const PRAYER_REQUESTS_CONTEXT = "prayer-requests" as const

export {
  assertCanCreatePrayerRequest,
  PrayerRequestCreationBlockedError,
} from "./creation-guard"
export { createPrayerRequest } from "./create-request"
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
