import { prisma } from "@/lib/db/prisma"

export type OutboxInput = {
  type: string
  aggregateType: string
  aggregateId: string
  payload: Record<string, unknown>
}

/**
 * Enfileira mensagem para processamento futuro.
 * Sem worker contínuo nesta sprint (Vercel serverless).
 */
export async function enqueueOutboxMessage(input: OutboxInput) {
  return prisma.outboxMessage.create({
    data: {
      type: input.type,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      payload: input.payload as object,
    },
  })
}
