/**
 * Política de validação V2 (+ hardening 02R) — classificação determinística,
 * sem IA e sem serviços externos de análise de texto.
 *
 * Princípio: o Ora Ora não julga orações; protege pessoas e garante reciprocidade legítima.
 *
 * Limitações (regras locais, cobertura incompleta):
 * - Não detecta todas as formas de abuso, ironia, dog-whistles ou ofensas codificadas.
 * - Não avalia sinceridade, fé, denominação, gramática ou escolaridade.
 * - Relatos legítimos de sofrimento/violência familiar NÃO são tratados como ofensa.
 * - Limites de frequência/duplicata são pontos de partida operacionais, não dogma.
 * - Moderação humana permanece necessária para casos ambíguos (manual_review).
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
  | "nonsensical_content"
  | "url_heavy"
  | "promo_language"
  | "contact_spam"
  | "high_frequency"
  | "duplicate_content"
  | "clear_ad_only"
  | "threat_language"
  | "harassment_language"

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
  /^teste\.?$/i,
  /^\.+$/,
]

/** Atalhos de teclado / lixo evidente (pré-envio). */
const NONSENSE_ONLY = [
  /^(asdf+|qwer(ty)?|zxcv+|hjkl+|xxx+|aaa+|bbb+|ccc+|1234+|abcd+)$/i,
  /^(.)\1{5,}$/,
]

const PROMO_HINTS =
  /\b(compre\s+agora|desconto|promo[cç][aã]o|ganhe\s+dinheiro|investimento\s+garantido|curso\s+pago|clique\s+aqui)\b/i
const CONTACT_SPAM =
  /(\+?\d[\d\s().-]{8,}\d)|(wa\.me\/)|(whatsapp)|(telegram\.me\/)|(t\.me\/)/i
const URL_RE = /https?:\/\/|www\./gi

/** Ameaças diretas / intenção de agressão ao destinatário. */
const THREAT_DIRECT =
  /\b(vou\s+te\s+(matar|bater|pegar|espancar)|te\s+mato|te\s+mato|matarei\s+voc[eê]|merece\s+morrer|vou\s+destruir\s+voc[eê])\b/i

/** Assédio/insulto objetivo (não cobre todas as ofensas). */
const HARASSMENT =
  /\b(vai\s+se\s+foder|seu?\s+lixo|idiot[ao]\s+de\s+merda|escrot[ao]|vagabund[ao]\s+nojent[oa]|morre\s+logo)\b/i

/**
 * Contexto de relato de sofrimento / pedido de cuidado.
 * Evita tratar denúncias legítimas de violência como ofensa.
 */
const SUFFERING_CONTEXT =
  /\b(sofreu|sofre|sofrendo|v[ií]tima|agredid[ao]|viol[eê]ncia|abuso|proteger|proteja|livre|livrai|ajud[ae]|cuidado|fam[ií]lia|marido|esposa|companheir[oa]|filho|filha|pai|m[aã]e|cura|cura[cç][aã]o|paz|for[cç]a|esperan[cç]a|consolo|conforto)\b/i

function countUrls(text: string) {
  return (text.match(URL_RE) ?? []).length
}

function lettersOnly(text: string) {
  return text.normalize("NFKC").replace(/[^\p{L}]/gu, "")
}

function vowelRatio(letters: string) {
  if (!letters) return 0
  const vowels = letters.match(/[aeiouáéíóúâêôãõàüAEIOUÁÉÍÓÚÂÊÔÃÕÀÜ]/g)?.length ?? 0
  return vowels / letters.length
}

function uniqueCharRatio(letters: string) {
  if (!letters) return 0
  return new Set([...letters.toLowerCase()]).size / letters.length
}

function wordTokens(text: string) {
  return text
    .normalize("NFKC")
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter((w) => w.length > 0)
}

const KEYBOARD_JUNK =
  /^(asdf+|qwer(ty)?|zxcv+|hjkl+|yuio+|agg+|fdsa+|poiu+|mnbv+)$/i

function isMeaningfulWord(token: string): boolean {
  const letters = lettersOnly(token)
  if (letters.length < 3) return false
  if (KEYBOARD_JUNK.test(letters)) return false
  if (/^\d+$/.test(token)) return false
  if (vowelRatio(letters) < 0.2) return false
  return true
}

/**
 * Conteúdo evidentemente sem significado (não exige vocabulário religioso).
 * Orações curtas com palavras reais passam.
 */
export function looksNonsensical(body: string): boolean {
  const trimmed = body.replace(/\r\n/g, "\n").trim()
  const compact = trimmed.replace(/\s+/g, "")
  if (NONSENSE_ONLY.some((re) => re.test(compact))) return true
  if (KEYBOARD_JUNK.test(compact)) return true

  const letters = lettersOnly(trimmed)
  const words = wordTokens(trimmed)
  const realWords = words.filter(isMeaningfulWord)

  // Curto e significativo: ≥2 palavras reais OU uma palavra ≥5 com vogais.
  if (letters.length <= 40) {
    if (realWords.length >= 2) return false
    if (realWords.length === 1 && lettersOnly(realWords[0]!).length >= 5) return false
    if (letters.length >= 4 && uniqueCharRatio(letters) <= 0.34) return true
    if (letters.length >= 6 && vowelRatio(letters) < 0.12) return true
    if (realWords.length === 0 && letters.length >= 4) return true
    return false
  }

  // Mais longo: poucas palavras reais + baixa densidade de vogais.
  if (realWords.length < 2 && vowelRatio(letters) < 0.15) return true
  if (realWords.length === 0) return true
  return false
}

function hasAdLikeLanguage(body: string) {
  return PROMO_HINTS.test(body) || CONTACT_SPAM.test(body)
}

/**
 * Classifica o texto + sinais contextuais.
 * Não avalia fé, sinceridade, denominação, gramática ou escolaridade.
 * Não exige vocabulário religioso específico para aceite.
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

  if (TRIVIAL_ONLY.some((re) => re.test(body)) || looksNonsensical(body)) {
    return {
      kind: "block_before_submit",
      code: "PRAYER_BODY_INSUFFICIENT",
      message:
        "Dedique algumas palavras à história desta pessoa e escreva uma oração por ela.",
      signals: TRIVIAL_ONLY.some((re) => re.test(body))
        ? ["trivial_message"]
        : ["nonsensical_content"],
    }
  }

  const urls = countUrls(body)
  if (urls >= 2) signals.push("url_heavy")
  if (PROMO_HINTS.test(body)) signals.push("promo_language")
  if (CONTACT_SPAM.test(body)) signals.push("contact_spam")

  const sufferingContext = SUFFERING_CONTEXT.test(body)
  if (THREAT_DIRECT.test(body)) {
    signals.push("threat_language")
  } else if (HARASSMENT.test(body) && !sufferingContext) {
    signals.push("harassment_language")
  }

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

  // Anúncio inequívoco: URLs + promo, sem necessidade de vocabulário religioso.
  const clearAd =
    urls >= 2 &&
    signals.includes("promo_language") &&
    !sufferingContext &&
    hasAdLikeLanguage(body)

  if (clearAd) {
    signals.push("clear_ad_only")
    return {
      kind: "decide",
      outcome: "rejected",
      signals,
      rationale: "Conteúdo objetivamente publicitário sem oração.",
      effects: { reciprocity: false, feedCount: false, solidarity: null },
    }
  }

  // Ameaça/assédio objetivos → moderação (não rejeição automática isolada de baixa confiança).
  if (signals.includes("threat_language") || signals.includes("harassment_language")) {
    return {
      kind: "decide",
      outcome: "manual_review",
      signals,
      rationale: "Sinais objetivos de ameaça ou assédio — moderação humana.",
      effects: { reciprocity: null, feedCount: null, solidarity: null },
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

  return {
    kind: "decide",
    outcome: "accepted",
    signals,
    rationale: null,
    effects: { reciprocity: true, feedCount: true, solidarity: null },
  }
}
