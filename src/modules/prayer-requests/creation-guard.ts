/**
 * Criação de pedido por usuário comum exige reciprocidade (Sprint 2).
 * Sprint 1: bloqueio explícito — sem endpoint público e sem bypass silencioso.
 */
export class PrayerRequestCreationBlockedError extends Error {
  readonly code = "PRAYER_REQUEST_CREATION_BLOCKED" as const

  constructor(
    message = "A publicação de novos pedidos exige uma oração válida prévia. Este fluxo ainda não está disponível.",
  ) {
    super(message)
    this.name = "PrayerRequestCreationBlockedError"
  }
}

export type CreatePrayerRequestIntent = {
  actorUserId: string
  /** Futuro: id da elegibilidade de reciprocidade a consumir. */
  eligibilityId?: string | null
}

/**
 * Ponto único de entrada futura para criação.
 * Na Sprint 1 sempre rejeita usuários comuns — a Sprint 2 tornará isso
 * transacionalmente dependente de elegibilidade real.
 */
export function assertCanCreatePrayerRequest(_intent: CreatePrayerRequestIntent): never {
  void _intent
  throw new PrayerRequestCreationBlockedError()
}
