import { prisma } from "@/lib/db/prisma"
import { recordAuditEvent } from "@/lib/security/audit"
import { fingerprintPayload, normalizeIdempotencyKey } from "@/lib/security/idempotency"
import {
  DomainError,
  EligibilityRequiredError,
  PrayerNotAllowedError,
} from "@/modules/intercession/errors"
import { PUBLIC_IDENTITY_MODES, type PublicIdentityMode } from "./types"
import { toPublicPrayerRequestDto } from "./public-dto"

export type CreatePrayerRequestInput = {
  authorId: string
  categoryId: string
  title: string
  story: string
  prayerNeed: string
  publicIdentityMode: PublicIdentityMode
  publicLabel?: string
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
  if (!title || !story || !prayerNeed) {
    throw new DomainError(
      "Preencha título, história, intenção e identificação pública.",
      "INVALID_REQUEST_PAYLOAD",
    )
  }

  const author = await prisma.user.findUnique({ where: { id: input.authorId } })
  if (!author || author.banned) {
    throw new PrayerNotAllowedError("Conta indisponível para publicar.", "ACCOUNT_SUSPENDED")
  }

  const publicLabel = derivePublicLabel(input.publicIdentityMode, author.name)
  if (input.publicLabel !== undefined && input.publicLabel.trim() !== publicLabel) {
    throw new DomainError(
      "A identificação pública não corresponde ao modo selecionado.",
      "PUBLIC_LABEL_MISMATCH",
      409,
    )
  }

  const requestHash = fingerprintPayload({
    categoryId: input.categoryId,
    title,
    story,
    prayerNeed,
    publicIdentityMode: input.publicIdentityMode,
  })

  const category = await prisma.prayerRequestCategory.findFirst({
    where: { id: input.categoryId, active: true },
  })
  if (!category) {
    throw new DomainError("Categoria inválida.", "CATEGORY_NOT_FOUND", 404)
  }

  // Idempotência de publicação
  const prior = await prisma.idempotencyRecord.findFirst({
    where: {
      scope: "prayer_request.create",
      userId: input.authorId,
      key: idempotencyKey,
    },
  })
  if (prior && prior.requestHash !== requestHash) {
    throw new DomainError(
      "Esta chave de idempotência já foi usada com dados diferentes.",
      "IDEMPOTENCY_PAYLOAD_CONFLICT",
      409,
    )
  }
  if (
    prior?.status === "COMPLETED" &&
    prior.responseBody &&
    typeof prior.responseBody === "object"
  ) {
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
  try {
    const created = await prisma.$transaction(async (tx) => {
      const reservation = await tx.idempotencyRecord.create({
        data: {
          scope: "prayer_request.create",
          key: idempotencyKey,
          requestHash,
          status: "STARTED",
          userId: input.authorId,
        },
      })

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

      await tx.idempotencyRecord.update({
        where: { id: reservation.id },
        data: {
          status: "COMPLETED",
          responseStatus: 201,
          responseBody: { prayerRequestId: request.id },
        },
      })

      await recordAuditEvent(
        {
          actorType: "user",
          actorUserId: input.authorId,
          action: "prayer_request.created",
          subjectType: "prayer_request",
          subjectId: request.id,
          metadata: { categoryId: category.id },
        },
        tx,
      )

      return request
    })

    return {
      prayerRequest: toPublicPrayerRequestDto(created),
      reused: false as const,
    }
  } catch (error) {
    const raced = await prisma.idempotencyRecord.findFirst({
      where: {
        scope: "prayer_request.create",
        userId: input.authorId,
        key: idempotencyKey,
      },
    })
    if (raced) {
      if (raced.requestHash !== requestHash) {
        throw new DomainError(
          "Esta chave de idempotência já foi usada com dados diferentes.",
          "IDEMPOTENCY_PAYLOAD_CONFLICT",
          409,
        )
      }
      const body = raced.responseBody as { prayerRequestId?: string } | null
      if (raced.status === "COMPLETED" && body?.prayerRequestId) {
        const existing = await prisma.prayerRequest.findUnique({
          where: { id: body.prayerRequestId },
          include: { category: true },
        })
        if (existing) {
          return { prayerRequest: toPublicPrayerRequestDto(existing), reused: true as const }
        }
      }
    }
    throw error
  }
}

export function derivePublicLabel(mode: PublicIdentityMode, name: string) {
  const tokens = name.trim().split(/\s+/).filter(Boolean)
  if (mode === "anonymous") return "Anônimo"
  if (mode === "given_name") return tokens[0] || "Anônimo"
  if (mode === "initials") {
    return tokens.map((token) => token[0]?.toLocaleUpperCase("pt-BR")).join(".")
  }
  return tokens.join(" ") || "Anônimo"
}
