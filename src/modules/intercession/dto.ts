type Passage = {
  id: string
  referenceLabel: string
  licenseStatus: string
  textBody: string | null
} | null

type Validation = {
  outcome: string
  effects: unknown
  rationale: string | null
  decidedAt: Date | null
  policyVersion: number
} | null

type PrayerRow = {
  id: string
  requestId: string
  intercessorId: string
  beneficiaryId: string
  medium: string
  body: string
  status: string
  createdAt: Date
  scripturePassage: Passage
  validation: Validation
}

/** DTO do intercessor / admin — não inclui dados privados do beneficiário. */
export function toPrayerDto(row: PrayerRow) {
  return {
    id: row.id,
    requestId: row.requestId,
    medium: row.medium,
    body: row.body,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    scripture: row.scripturePassage
      ? {
          id: row.scripturePassage.id,
          referenceLabel: row.scripturePassage.referenceLabel,
          licenseStatus: row.scripturePassage.licenseStatus,
          textBody:
            row.scripturePassage.licenseStatus === "reference_only"
              ? null
              : row.scripturePassage.textBody,
        }
      : null,
    validation: row.validation
      ? {
          outcome: row.validation.outcome,
          effects: row.validation.effects,
          rationale: row.validation.rationale,
          decidedAt: row.validation.decidedAt?.toISOString() ?? null,
          policyVersion: row.validation.policyVersion,
        }
      : null,
  }
}

export type PrayerDto = ReturnType<typeof toPrayerDto>
