/**
 * Espelha as regras de submitPrayer para a UI — sem ampliar permissões.
 * Achado UI-05D: pedidos `paused` continuam aceitos pelo backend atual;
 * apenas `closed` e `removed` são rejeitados na submissão.
 */
export type PrayerSubmissionAvailability =
  | { canSubmit: true; reason: null }
  | {
      canSubmit: false
      reason: "REQUEST_CLOSED" | "REQUEST_NOT_ACCEPTING" | "REQUEST_RESTRICTED" | "SELF_PRAYER_FORBIDDEN"
      message: string
    }

export function getPrayerSubmissionAvailability(input: {
  requestStatus: string
  contentVisibility: string
  viewerIsAuthor: boolean
}): PrayerSubmissionAvailability {
  if (input.viewerIsAuthor) {
    return {
      canSubmit: false,
      reason: "SELF_PRAYER_FORBIDDEN",
      message:
        "Este pedido foi publicado por você. Aguarde as orações de outras pessoas da comunidade.",
    }
  }
  if (input.requestStatus === "removed") {
    return {
      canSubmit: false,
      reason: "REQUEST_NOT_ACCEPTING",
      message: "Este pedido não recebe novas orações.",
    }
  }
  if (input.requestStatus === "closed") {
    return {
      canSubmit: false,
      reason: "REQUEST_CLOSED",
      message: "Este pedido está encerrado e não recebe novas orações.",
    }
  }
  if (input.contentVisibility !== "authenticated") {
    return {
      canSubmit: false,
      reason: "REQUEST_RESTRICTED",
      message: "Você não tem acesso para orar neste pedido.",
    }
  }
  // open | paused — alinhado ao submitPrayer atual
  return { canSubmit: true, reason: null }
}
