import { getRequestEligibilitySnapshot } from "@/modules/reciprocity"
import { EligibilityRequiredError } from "@/modules/intercession/errors"

export { EligibilityRequiredError as PrayerRequestCreationBlockedError }

export type CreatePrayerRequestIntent = {
  actorUserId: string
  eligibilityId?: string | null
}

/**
 * Pré-checagem de reciprocidade. A criação real consome a elegibilidade na transação.
 */
export async function assertCanCreatePrayerRequest(intent: CreatePrayerRequestIntent) {
  const snapshot = await getRequestEligibilitySnapshot(intent.actorUserId)
  if (!snapshot.canPublish || !snapshot.openEligibilityId) {
    throw new EligibilityRequiredError(snapshot.message)
  }
  return snapshot
}
