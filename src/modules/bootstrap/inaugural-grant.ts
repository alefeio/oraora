import type { Prisma, PrismaClient } from "@/generated/prisma/client"
import { recordAuditEvent } from "@/lib/security/audit"
import {
  assertBootstrapDbTarget,
  redactBootstrapFingerprint,
  type DeclaredBootstrapEnvironment,
} from "./db-target"

type Db = PrismaClient | Prisma.TransactionClient

export const INAUGURAL_BOOTSTRAP_ACTION = "bootstrap.inaugural_admin_grant"
export const INAUGURAL_BOOTSTRAP_SUBJECT = "community_bootstrap"
/** Marcador global único via PolicyDocument @@unique([domain, version]). */
export const INAUGURAL_POLICY_DOMAIN = "community_bootstrap"
export const INAUGURAL_POLICY_VERSION = 1

export type BootstrapInspection = {
  userCount: number
  realRequestCount: number
  openVisibleRequestCount: number
  openEligibilityCount: number
  adminGrantCount: number
  syntheticFixtureCount: number
  priorBootstrapAuditCount: number
  bootstrapPolicyPresent: boolean
  communityInitialized: boolean
}

export type BootstrapOperator =
  | {
      kind: "verified_admin"
      userId: string
    }
  | {
      kind: "system_operator"
      label: string
    }

export type BootstrapGrantInput = {
  founderUserId: string
  operator: BootstrapOperator
  correlationId?: string
  /** Exige autorização explícita do operador (script --confirm). */
  ownerAuthorized: boolean
  /** Ambiente declarado pelo operador (preview|local). Production é sempre recusado. */
  declaredEnvironment: DeclaredBootstrapEnvironment
  /**
   * Quando true, aplica assertBootstrapDbTarget no ambiente do processo.
   * Testes unitários de lógica podem desligar e injetar fingerprint já validado.
   */
  enforceDbTarget?: boolean
}

export type BootstrapGrantResult =
  | {
      status: "granted"
      eligibilityId: string
      inspection: BootstrapInspection
      dbTarget?: ReturnType<typeof redactBootstrapFingerprint>
    }
  | {
      status: "idempotent_existing"
      eligibilityId: string
      inspection: BootstrapInspection
      reason: string
      dbTarget?: ReturnType<typeof redactBootstrapFingerprint>
    }
  | {
      status: "blocked"
      reason: string
      inspection: BootstrapInspection
      dbTarget?: ReturnType<typeof redactBootstrapFingerprint>
    }

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const code = "code" in error ? String((error as { code?: string }).code) : ""
  if (code === "P2002") return true
  const message = error instanceof Error ? error.message : String(error)
  return /unique constraint|Unique constraint/i.test(message)
}

/**
 * Comunidade inicializada: pedido real, policy de bootstrap ou audit inaugural.
 */
export async function inspectCommunityBootstrapState(db: Db): Promise<BootstrapInspection> {
  const [
    userCount,
    realRequestCount,
    openVisibleRequestCount,
    openEligibilityCount,
    adminGrantCount,
    syntheticFixtureCount,
    priorBootstrapAuditCount,
    bootstrapPolicy,
  ] = await Promise.all([
    db.user.count(),
    db.prayerRequest.count({ where: { isSyntheticFixture: false } }),
    db.prayerRequest.count({
      where: {
        isSyntheticFixture: false,
        status: "open",
        contentVisibility: { in: ["authenticated", "public"] },
      },
    }),
    db.requestEligibility.count({ where: { status: "open" } }),
    db.requestEligibility.count({ where: { sourceType: "admin_grant" } }),
    db.prayerRequest.count({ where: { isSyntheticFixture: true } }),
    db.auditEvent.count({ where: { action: INAUGURAL_BOOTSTRAP_ACTION } }),
    db.policyDocument.findUnique({
      where: {
        domain_version: {
          domain: INAUGURAL_POLICY_DOMAIN,
          version: INAUGURAL_POLICY_VERSION,
        },
      },
    }),
  ])

  const bootstrapPolicyPresent = Boolean(bootstrapPolicy)

  return {
    userCount,
    realRequestCount,
    openVisibleRequestCount,
    openEligibilityCount,
    adminGrantCount,
    syntheticFixtureCount,
    priorBootstrapAuditCount,
    bootstrapPolicyPresent,
    communityInitialized:
      realRequestCount > 0 || priorBootstrapAuditCount > 0 || bootstrapPolicyPresent,
  }
}

async function findExistingInauguralGrant(db: Db, founderUserId?: string) {
  if (founderUserId) {
    const forFounder = await db.requestEligibility.findFirst({
      where: { userId: founderUserId, sourceType: "admin_grant" },
      orderBy: { openedAt: "asc" },
    })
    if (forFounder) return forFounder
  }
  return db.requestEligibility.findFirst({
    where: { sourceType: "admin_grant" },
    orderBy: { openedAt: "asc" },
  })
}

/**
 * Concede no máximo UMA elegibilidade `admin_grant` inaugural na comunidade.
 * Unicidade global: PolicyDocument (domain,version) único + mesma TX do grant/audit.
 */
export async function grantInauguralAdminEligibility(
  db: PrismaClient,
  input: BootstrapGrantInput,
): Promise<BootstrapGrantResult> {
  const enforceDbTarget = input.enforceDbTarget !== false
  let dbTarget: ReturnType<typeof redactBootstrapFingerprint> | undefined

  if (enforceDbTarget) {
    const fp = assertBootstrapDbTarget(input.declaredEnvironment)
    dbTarget = redactBootstrapFingerprint(fp)
    if (!fp.allowedForApply && input.ownerAuthorized) {
      const inspection = await inspectCommunityBootstrapState(db)
      return {
        status: "blocked",
        reason: `db_target_rejected:${fp.reason}`,
        inspection,
        dbTarget,
      }
    }
  }

  const inspection = await inspectCommunityBootstrapState(db)

  if (!input.ownerAuthorized) {
    return {
      status: "blocked",
      reason: "owner_authorization_required",
      inspection,
      dbTarget,
    }
  }

  if (input.declaredEnvironment !== "preview" && input.declaredEnvironment !== "local") {
    return {
      status: "blocked",
      reason: "environment_not_allowed",
      inspection,
      dbTarget,
    }
  }

  if (input.operator.kind === "verified_admin") {
    const admin = await db.user.findUnique({ where: { id: input.operator.userId } })
    if (!admin || admin.banned || admin.role !== "ADMIN") {
      return {
        status: "blocked",
        reason: "operator_not_verified_admin",
        inspection,
        dbTarget,
      }
    }
  }

  const founder = await db.user.findUnique({ where: { id: input.founderUserId } })
  if (!founder || founder.banned) {
    return {
      status: "blocked",
      reason: "founder_unavailable",
      inspection,
      dbTarget,
    }
  }

  if (inspection.bootstrapPolicyPresent || inspection.priorBootstrapAuditCount > 0) {
    const existing = await findExistingInauguralGrant(db, input.founderUserId)
    if (existing && existing.userId === input.founderUserId) {
      return {
        status: "idempotent_existing",
        eligibilityId: existing.id,
        inspection,
        reason: "bootstrap_already_recorded",
        dbTarget,
      }
    }
    return {
      status: "blocked",
      reason: "community_already_bootstrapped",
      inspection,
      dbTarget,
    }
  }

  if (inspection.realRequestCount > 0 || inspection.openVisibleRequestCount > 0) {
    return {
      status: "blocked",
      reason: "community_already_has_real_requests",
      inspection,
      dbTarget,
    }
  }

  const existingOpen = await db.requestEligibility.findFirst({
    where: { userId: input.founderUserId, status: "open" },
  })
  if (existingOpen) {
    return {
      status: "idempotent_existing",
      eligibilityId: existingOpen.id,
      inspection,
      reason: "founder_already_has_open_eligibility",
      dbTarget,
    }
  }

  const existingGrant = await db.requestEligibility.findFirst({
    where: { userId: input.founderUserId, sourceType: "admin_grant" },
    orderBy: { openedAt: "asc" },
  })
  if (existingGrant) {
    return {
      status: "idempotent_existing",
      eligibilityId: existingGrant.id,
      inspection,
      reason: "founder_already_has_admin_grant",
      dbTarget,
    }
  }

  const actorType = input.operator.kind === "verified_admin" ? "admin" : "system"
  const actorUserId =
    input.operator.kind === "verified_admin" ? input.operator.userId : null

  try {
    const created = await db.$transaction(async (tx) => {
      // Trava global atômica: primeira inserção do PolicyDocument vence.
      await tx.policyDocument.create({
        data: {
          domain: INAUGURAL_POLICY_DOMAIN,
          version: INAUGURAL_POLICY_VERSION,
          status: "activated",
          activatedAt: new Date(),
          document: {
            kind: "inaugural_bootstrap_lock",
            founderUserIdPrefix: input.founderUserId.slice(0, 8),
            operatorKind: input.operator.kind,
          },
        },
      })

      const again = await inspectCommunityBootstrapState(tx)
      if (again.realRequestCount > 0) {
        throw new Error("community_already_has_real_requests")
      }

      const openRace = await tx.requestEligibility.findFirst({
        where: { userId: input.founderUserId, status: "open" },
      })
      if (openRace) {
        throw new Error(`idempotent:${openRace.id}`)
      }

      const anyGrant = await tx.requestEligibility.findFirst({
        where: { sourceType: "admin_grant" },
      })
      if (anyGrant) {
        throw new Error("community_already_bootstrapped")
      }

      const eligibility = await tx.requestEligibility.create({
        data: {
          userId: input.founderUserId,
          sourceType: "admin_grant",
          status: "open",
        },
      })

      await recordAuditEvent(
        {
          actorType,
          actorUserId,
          action: INAUGURAL_BOOTSTRAP_ACTION,
          subjectType: INAUGURAL_BOOTSTRAP_SUBJECT,
          subjectId: eligibility.id,
          correlationId: input.correlationId,
          metadata: {
            declaredEnvironment: input.declaredEnvironment,
            beneficiaryUserIdPrefix: input.founderUserId.slice(0, 8),
            operatorKind: input.operator.kind,
            operatorLabel:
              input.operator.kind === "system_operator" ? input.operator.label : undefined,
            operatorUserIdPrefix:
              input.operator.kind === "verified_admin"
                ? input.operator.userId.slice(0, 8)
                : undefined,
            sourceType: "admin_grant",
            note: "one-time inaugural eligibility; beneficiary is not implied admin",
            dbTarget,
          },
        },
        tx,
      )

      return eligibility
    })

    const after = await inspectCommunityBootstrapState(db)
    return {
      status: "granted",
      eligibilityId: created.id,
      inspection: after,
      dbTarget,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.startsWith("idempotent:")) {
      return {
        status: "idempotent_existing",
        eligibilityId: message.slice("idempotent:".length),
        inspection: await inspectCommunityBootstrapState(db),
        reason: "concurrent_open_eligibility",
        dbTarget,
      }
    }
    if (isUniqueViolation(error) || message === "community_already_bootstrapped") {
      const existing = await findExistingInauguralGrant(db, input.founderUserId)
      const after = await inspectCommunityBootstrapState(db)
      if (existing && existing.userId === input.founderUserId) {
        return {
          status: "idempotent_existing",
          eligibilityId: existing.id,
          inspection: after,
          reason: "concurrent_global_lock_same_founder",
          dbTarget,
        }
      }
      return {
        status: "blocked",
        reason: "concurrent_global_lock",
        inspection: after,
        dbTarget,
      }
    }
    if (message === "community_already_has_real_requests") {
      return {
        status: "blocked",
        reason: message,
        inspection: await inspectCommunityBootstrapState(db),
        dbTarget,
      }
    }
    throw error
  }
}
