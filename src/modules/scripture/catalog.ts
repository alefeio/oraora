/**
 * Catálogo oficial de referências (sem texto de traduções protegidas).
 * Fonte canônica espelhada em scripts/seed-scripture.ts.
 */
export const SCRIPTURE_PASSAGES = [
  { referenceLabel: "Isaías 41:10", book: "Isaías", chapter: 41, verseStart: 10, topics: ["saude", "sofrimento"] },
  { referenceLabel: "Salmo 46:1", book: "Salmo", chapter: 46, verseStart: 1, topics: ["saude", "sofrimento"] },
  {
    referenceLabel: "Filipenses 4:6-7",
    book: "Filipenses",
    chapter: 4,
    verseStart: 6,
    verseEnd: 7,
    topics: ["sofrimento", "financas"],
  },
  { referenceLabel: "Salmo 34:18", book: "Salmo", chapter: 34, verseStart: 18, topics: ["luto", "sofrimento"] },
  {
    referenceLabel: "Romanos 12:12",
    book: "Romanos",
    chapter: 12,
    verseStart: 12,
    topics: ["familia", "relacionamentos"],
  },
  { referenceLabel: "Colossenses 3:23", book: "Colossenses", chapter: 3, verseStart: 23, topics: ["trabalho"] },
  { referenceLabel: "Mateus 6:33", book: "Mateus", chapter: 6, verseStart: 33, topics: ["financas", "espiritual"] },
  { referenceLabel: "Salmo 23:1", book: "Salmo", chapter: 23, verseStart: 1, topics: ["espiritual", "gratidao"] },
  {
    referenceLabel: "1 Tessalonicenses 5:18",
    book: "1 Tessalonicenses",
    chapter: 5,
    verseStart: 18,
    topics: ["gratidao"],
  },
  { referenceLabel: "Tiago 5:16", book: "Tiago", chapter: 5, verseStart: 16, topics: ["dependencia", "espiritual"] },
] as const

export const SCRIPTURE_TOPICS = [
  { slug: "saude", name: "Saúde", categorySlug: "saude" },
  { slug: "familia", name: "Família", categorySlug: "familia" },
  { slug: "relacionamentos", name: "Relacionamentos", categorySlug: "relacionamentos" },
  { slug: "trabalho", name: "Trabalho", categorySlug: "trabalho-desemprego" },
  { slug: "financas", name: "Finanças", categorySlug: "financas" },
  { slug: "dependencia", name: "Dependência", categorySlug: "dependencia" },
  { slug: "luto", name: "Luto", categorySlug: "luto" },
  { slug: "sofrimento", name: "Sofrimento", categorySlug: "sofrimento-emocional" },
  { slug: "espiritual", name: "Vida espiritual", categorySlug: "vida-espiritual" },
  { slug: "gratidao", name: "Gratidão", categorySlug: "gratidao" },
] as const
