/**
 * Política de validação V2 — classificação determinística, sem IA e sem serviços externos.
 *
 * Princípio: o Ora Ora não julga orações; protege pessoas e garante reciprocidade legítima.
 *
 * Limites de frequência abaixo são **configuráveis / pontos de partida operacionais**,
 * não dogma de produto. Ajuste via constantes versionadas nesta política.
 */

export const VALIDATION_POLICY_VERSION = 2

/**
 * Limites configuráveis de abuso (janela deslizante).
 * Um sinal isolado de baixa confiança NÃO rejeita automaticamente.
 */
export const ABUSE_RATE_LIMITS = {
  /** Janela de observação (ms). */
  windowMs: 60 * 60 * 1000,
  /** Submissões na janela: sinal fraco (não força revisão sozinho). */
  softMaxSubmissions: 8,
  /** Submissões na janela: força manual_review. */
  hardMaxSubmissions: 20,
  /** Hashes idênticos recentes: sinal fraco. */
  duplicateHashSoft: 2,
  /** Hashes idênticos recentes: força manual_review. */
  duplicateHashHard: 5,
} as const

export type ValidationOutcome = "accepted" | "manual_review" | "rejected"

export type ClassificationSignal =
  | "trivial_message"
  | "empty_body"
  | "url_heavy"
  | "promo_language"
  | "contact_spam"
  | "high_frequency"
  | "duplicate_content"
  | "clear_ad_only"

export type ClassificationResult =
  | {
      kind: "block_before_submit"
      code: "PRAYER_BODY_REQUIRED" | "PRAYER_BODY_INSUFFICIENT"
      message: string
      signals: ClassificationSignal[]
    }
  | {
      kind: "decide"
      outcome: ValidationOutcome
      signals: ClassificationSignal[]
      rationale: string | null
      effects: {
        reciprocity: boolean | null
        feedCount: boolean | null
        solidarity: null
      }
    }

const TRIVIAL_ONLY = [
  /^orei\.?$/i,
  /^am[eé]m\.?$/i,
  /^deus\s+aben[cç]oe\.?$/i,
  /^gl[oó]ria\s+(a\s+)?deus\.?$/i,
  /^obrigad[oa]\.?$/i,
  /^ok\.?$/i,
  /^\.+$/,
]

const PROMO_HINTS =
  /\b(compre\s+agora|desconto|promo[cç][aã]o|ganhe\s+dinheiro|investimento\s+garantido|curso\s+pago|clique\s+aqui)\b/i
const CONTACT_SPAM =
  /(\+?\d[\d\s().-]{8,}\d)|(wa\.me\/)|(whatsapp)|(telegram\.me\/)|(t\.me\/)/i
const URL_RE = /https?:\/\/|www\./gi

function countUrls(text: string) {
  return (text.match(URL_RE) ?? []).length
}

function hasPrayerLanguage(text: string) {
  return /\b(senhor|deus|jesus|pai|esp[ií]rito|ora[cç][aã]o|ore|orando|aben[cç]oe|miseric[oó]rdia|paz|am[eé]m|cuide|cuida|protege|conforto|for[cç]a|esperan[cç]a|fam[ií]lia|sa[uú]de)\b/i.test(
    text,
  )
}

/**
 * Classifica o texto + sinais contextuais.
 * Não avalia fé, sinceridade, denominação, gramática ou escolaridade.
 */
export function classifyPrayerSubmission(input: {
  body: string
  /** Contagem de submissões do intercessor na janela configurável. */
  submissionsInWindow: number
  /** Contagem de orações recentes com o mesmo contentHash. */
  duplicateHashCount: number
}): ClassificationResult {
  const body = input.body.replace(/\r\n/g, "\n").trim()
  const signals: ClassificationSignal[] = []

  if (body.length < 1) {
    return {
      kind: "block_before_submit",
      code: "PRAYER_BODY_REQUIRED",
      message: "Escreva uma oração antes de enviar.",
      signals: ["empty_body"],
    }
  }

  if (TRIVIAL_ONLY.some((re) => re.test(body))) {
    return {
      kind: "block_before_submit",
      code: "PRAYER_BODY_INSUFFICIENT",
      message:
        "Dedique algumas palavras à história desta pessoa e escreva uma oração por ela.",
      signals: ["trivial_message"],
    }
  }

  const urls = countUrls(body)
  if (urls >= 2) signals.push("url_heavy")
  if (PROMO_HINTS.test(body)) signals.push("promo_language")
  if (CONTACT_SPAM.test(body)) signals.push("contact_spam")

  if (input.submissionsInWindow >= ABUSE_RATE_LIMITS.hardMaxSubmissions) {
    signals.push("high_frequency")
  } else if (input.submissionsInWindow >= ABUSE_RATE_LIMITS.softMaxSubmissions) {
    signals.push("high_frequency")
  }

  if (input.duplicateHashCount >= ABUSE_RATE_LIMITS.duplicateHashHard) {
    signals.push("duplicate_content")
  } else if (input.duplicateHashCount >= ABUSE_RATE_LIMITS.duplicateHashSoft) {
    signals.push("duplicate_content")
  }

  const onlyUrlsOrPromo =
    urls >= 1 &&
    !hasPrayerLanguage(body) &&
    (PROMO_HINTS.test(body) || CONTACT_SPAM.test(body) || urls >= 2)

  if (onlyUrlsOrPromo && signals.includes("promo_language") && signals.includes("url_heavy")) {
    signals.push("clear_ad_only")
    return {
      kind: "decide",
      outcome: "rejected",
      signals,
      rationale: "Conteúdo objetivamente publicitário sem oração.",
      effects: { reciprocity: false, feedCount: false, solidarity: null },
    }
  }

  const hardSignals = new Set<ClassificationSignal>([
    "high_frequency",
    "duplicate_content",
    "url_heavy",
    "promo_language",
    "contact_spam",
  ])
  const hardHits = signals.filter((s) => hardSignals.has(s))

  // Força revisão: frequência dura, duplicata dura, ou combinação de sinais de abuso.
  const forceReview =
    input.submissionsInWindow >= ABUSE_RATE_LIMITS.hardMaxSubmissions ||
    input.duplicateHashCount >= ABUSE_RATE_LIMITS.duplicateHashHard ||
    hardHits.length >= 2 ||
    (signals.includes("contact_spam") && signals.includes("promo_language"))

  if (forceReview) {
    return {
      kind: "decide",
      outcome: "manual_review",
      signals,
      rationale: "Sinais objetivos de risco — moderação humana por exceção.",
      effects: { reciprocity: null, feedCount: null, solidarity: null },
    }
  }

  // Sinal isolado fraco: aceita (não rejeita por baixa confiança).
  return {
    kind: "decide",
    outcome: "accepted",
    signals,
    rationale: null,
    effects: { reciprocity: true, feedCount: true, solidarity: null },
  }
}
