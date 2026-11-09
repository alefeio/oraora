import { prisma } from "@/lib/db/prisma"
import { recordAuditEvent } from "@/lib/security/audit"
import { normalizeIdempotencyKey } from "@/lib/security/idempotency"
import { DomainError, EligibilityRequiredError, PrayerNotAllowedError } from "@/modules/intercession/errors"
import { PUBLIC_IDENTITY_MODES, type PublicIdentityMode } from "./types"
import { toPublicPrayerRequestDto } from "./public-dto"

export type CreatePrayerRequestInput = {
  authorId: string
  categoryId: string
  title: string
  story: string
  prayerNeed: string
  publicIdentityMode: PublicIdentityMode
  publicLabel: string
  idempotencyKey: string
}

export async function createPrayerRequest(input: CreatePrayerRequestInput) {
  const idempotencyKey = normalizeIdempotencyKey(input.idempotencyKey)
  if (!idempotencyKey) {
    throw new DomainError("Chave de idempotência inválida.", "INVALID_IDEMPOTENCY_KEY")
  }

  if (!PUBLIC_IDENTITY_MODES.includes(input.publicIdentityMode)) {
    throw new DomainError("Identidade pública inválida.", "INVALID_PUBLIC_IDENTITY")
  }

  const title = input.title.trim()
  const story = input.story.trim()
  const prayerNeed = input.prayerNeed.trim()
  const publicLabel = input.publicLabel.trim()
  if (!title || !story || !prayerNeed || !publicLabel) {
    throw new DomainError("Preencha título, história, intenção e identificação pública.", "INVALID_REQUEST_PAYLOAD")
  }

  const author = await prisma.user.findUnique({ where: { id: input.authorId } })
  if (!author || author.banned) {
    throw new PrayerNotAllowedError("Conta indisponível para publicar.", "ACCOUNT_SUSPENDED")
  }

  const category = await prisma.prayerRequestCategory.findFirst({
    where: { id: input.categoryId, active: true },
  })
  if (!category) {
    throw new DomainError("Categoria inválida.", "CATEGORY_NOT_FOUND", 404)
  }

  // Idempotência de publicação
  const prior = await prisma.idempotencyRecord.findUnique({
    where: { scope_key: { scope: "prayer_request.create", key: idempotencyKey } },
  })
  if (prior?.status === "COMPLETED" && prior.responseBody && typeof prior.responseBody === "object") {
    const priorBody = prior.responseBody as { prayerRequestId?: string }
    if (priorBody.prayerRequestId) {
      const existing = await prisma.prayerRequest.findUnique({
        where: { id: priorBody.prayerRequestId },
        include: { category: true },
      })
      if (existing) {
        return { prayerRequest: toPublicPrayerRequestDto(existing), reused: true as const }
      }
    }
  }

  // Consumo condicional (status=open) na mesma transação da criação:
  // sob corrida, só um updateMany vence; o perdedor faz rollback do pedido.
  const created = await prisma.$transaction(async (tx) => {
    const open = await tx.requestEligibility.findFirst({
      where: { userId: input.authorId, status: "open" },
    })
    if (!open) {
      throw new EligibilityRequiredError()
    }

    const request = await tx.prayerRequest.create({
      data: {
        authorId: input.authorId,
        categoryId: category.id,
        title,
        story,
        prayerNeed,
        publicIdentityMode: input.publicIdentityMode,
        publicLabel,
        contentVisibility: "authenticated",
        status: "open",
        validPrayerCount: 0,
        rankedAt: new Date(),
        isSyntheticFixture: false,
      },
      include: { category: true },
    })

    const consumed = await tx.requestEligibility.updateMany({
      where: { id: open.id, status: "open" },
      data: {
        status: "consumed",
        consumedAt: new Date(),
        consumedByRequestId: request.id,
      },
    })
    if (consumed.count !== 1) {
      throw new EligibilityRequiredError()
    }

    await tx.idempotencyRecord.upsert({
      where: { scope_key: { scope: "prayer_request.create", key: idempotencyKey } },
      create: {
        scope: "prayer_request.create",
        key: idempotencyKey,
        requestHash: idempotencyKey,
        status: "COMPLETED",
        responseStatus: 201,
        responseBody: { prayerRequestId: request.id },
        userId: input.authorId,
      },
      update: {
        status: "COMPLETED",
        responseStatus: 201,
        responseBody: { prayerRequestId: request.id },
      },
    })

    return request
  })

  await recordAuditEvent({
    actorType: "user",
    actorUserId: input.authorId,
    action: "prayer_request.created",
    subjectType: "prayer_request",
    subjectId: created.id,
    metadata: { categoryId: category.id },
  })

  return {
    prayerRequest: toPublicPrayerRequestDto(created),
    reused: false as const,
  }
}
