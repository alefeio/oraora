import { isAdminRole } from "@/lib/auth/policy"

export type PrayerReadActor = {
  id: string
  role: string
  banned?: boolean | null
}

export type PrayerReadSubject = {
  intercessorId: string
  beneficiaryId: string
  validation?: { outcome: string } | null
}

export function getPrayerReadAccess(actor: PrayerReadActor, prayer: PrayerReadSubject) {
  if (actor.banned) return "forbidden" as const
  const isOwner = prayer.intercessorId === actor.id
  const isBeneficiary = prayer.beneficiaryId === actor.id
  const isAdmin = isAdminRole(actor.role)
  if (!isOwner && !isBeneficiary && !isAdmin) return "forbidden" as const
  if (isBeneficiary && !isOwner && !isAdmin && prayer.validation?.outcome !== "accepted") {
    return "hidden" as const
  }
  return "allowed" as const
}
