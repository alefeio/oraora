import type { Prisma, PrismaClient } from "@/generated/prisma/client"
import { recordAuditEvent } from "@/lib/security/audit"

type Db = PrismaClient | Prisma.TransactionClient

export const INAUGURAL_BOOTSTRAP_ACTION = "bootstrap.inaugural_admin_grant"
export const INAUGURAL_BOOTSTRAP_SUBJECT = "community_bootstrap"

export type BootstrapInspection = {
  userCount: number
  realRequestCount: number
  openVisibleRequestCount: number
  openEligibilityCount: number
  adminGrantCount: number
  syntheticFixtureCount: number
  priorBootstrapAuditCount: number
  communityInitialized: boolean
}

export type BootstrapGrantInput = {
  founderUserId: string
  actorUserId?: string | null
  correlationId?: string
  /** Exige autorização explícita do operador (script --confirm). */
  ownerAuthorized: boolean
  /** Ambiente declarado pelo operador (preview|local). Production é sempre recusado. */
  declaredEnvironment: "preview" | "local"
}

export type BootstrapGrantResult =
  | {
      status: "granted"
      eligibilityId: string
      inspection: BootstrapInspection
    }
  | {
      status: "idempotent_existing"
      eligibilityId: string
      inspection: BootstrapInspection
      reason: string
    }
  | {
      status: "blocked"
      reason: string
      inspection: BootstrapInspection
    }

/**
 * Comunidade considerada inicializada quando já existe pedido real (não fixture)
 * aberto/visível ou quando já houve bootstrap inaugural registrado.
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
  ])

  return {
    userCount,
    realRequestCount,
    openVisibleRequestCount,
    openEligibilityCount,
    adminGrantCount,
    syntheticFixtureCount,
    priorBootstrapAuditCount,
    communityInitialized: realRequestCount > 0 || priorBootstrapAuditCount > 0,
  }
}

/**
 * Concede no máximo uma elegibilidade `admin_grant` inaugural à conta fundadora.
 * Idempotente: se já houver grant/open da fundadora ou bootstrap auditado, não duplica.
 */
export async function grantInauguralAdminEligibility(
  db: PrismaClient,
  input: BootstrapGrantInput,
): Promise<BootstrapGrantResult> {
  const inspection = await inspectCommunityBootstrapState(db)

  if (!input.ownerAuthorized) {
    return {
      status: "blocked",
      reason: "owner_authorization_required",
      inspection,
    }
  }

  if (input.declaredEnvironment !== "preview" && input.declaredEnvironment !== "local") {
    return {
      status: "blocked",
      reason: "environment_not_allowed",
      inspection,
    }
  }

  if (inspection.communityInitialized && inspection.priorBootstrapAuditCount > 0) {
    const existing = await db.requestEligibility.findFirst({
      where: {
        userId: input.founderUserId,
        sourceType: "admin_grant",
      },
      orderBy: { openedAt: "asc" },
    })
    if (existing) {
      return {
        status: "idempotent_existing",
        eligibilityId: existing.id,
        inspection,
        reason: "bootstrap_already_recorded",
      }
    }
    return {
      status: "blocked",
      reason: "community_already_bootstrapped",
      inspection,
    }
  }

  if (inspection.openVisibleRequestCount > 0 || inspection.realRequestCount > 0) {
    return {
      status: "blocked",
      reason: "community_already_has_real_requests",
      inspection,
    }
  }

  const founder = await db.user.findUnique({ where: { id: input.founderUserId } })
  if (!founder || founder.banned) {
    return {
      status: "blocked",
      reason: "founder_unavailable",
      inspection,
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
    }
  }

  try {
    const created = await db.$transaction(async (tx) => {
      // Re-checagem sob lock lógico via auditoria + create concorrente.
      const again = await inspectCommunityBootstrapState(tx)
      if (again.realRequestCount > 0 || again.priorBootstrapAuditCount > 0) {
        throw new Error("community_already_initialized")
      }

      const openRace = await tx.requestEligibility.findFirst({
        where: { userId: input.founderUserId, status: "open" },
      })
      if (openRace) {
        throw new Error(`idempotent:${openRace.id}`)
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
          actorType: "admin",
          actorUserId: input.actorUserId ?? input.founderUserId,
          action: INAUGURAL_BOOTSTRAP_ACTION,
          subjectType: INAUGURAL_BOOTSTRAP_SUBJECT,
          subjectId: eligibility.id,
          correlationId: input.correlationId,
          metadata: {
            declaredEnvironment: input.declaredEnvironment,
            founderUserIdPrefix: input.founderUserId.slice(0, 8),
            sourceType: "admin_grant",
            note: "one-time inaugural eligibility; no cumulative credits",
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
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.startsWith("idempotent:")) {
      return {
        status: "idempotent_existing",
        eligibilityId: message.slice("idempotent:".length),
        inspection: await inspectCommunityBootstrapState(db),
        reason: "concurrent_open_eligibility",
      }
    }
    if (message === "community_already_initialized") {
      return {
        status: "blocked",
        reason: "community_already_initialized",
        inspection: await inspectCommunityBootstrapState(db),
      }
    }
    throw error
  }
}
