import { prisma } from "@/lib/db/prisma"

export type AuditInput = {
  actorType: "user" | "system" | "admin"
  actorUserId?: string | null
  action: string
  subjectType?: string
  subjectId?: string
  correlationId?: string
  metadata?: Record<string, unknown>
}

/**
 * Grava evento de auditoria. Não persiste segredos (senhas, tokens, chaves Pix).
 */
export async function recordAuditEvent(input: AuditInput) {
  return prisma.auditEvent.create({
    data: {
      actorType: input.actorType,
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      correlationId: input.correlationId,
      metadata: input.metadata as object,
    },
  })
}
