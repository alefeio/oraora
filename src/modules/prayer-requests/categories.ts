import { createHash } from "node:crypto"
import { prisma } from "@/lib/db/prisma"
import type { SafetyClass } from "./types"

export type CategorySeed = {
  slug: string
  name: string
  description: string
  sortOrder: number
  safetyClass: SafetyClass
}

export const INITIAL_CATEGORIES: CategorySeed[] = [
  {
    slug: "saude",
    name: "Saúde",
    description: "Enfermidades, tratamentos e cuidados com o corpo.",
    sortOrder: 10,
    safetyClass: "health",
  },
  {
    slug: "familia",
    name: "Família",
    description: "Relações familiares e cuidados com a casa.",
    sortOrder: 20,
    safetyClass: "none",
  },
  {
    slug: "relacionamentos",
    name: "Relacionamentos",
    description: "Vínculos afetivos, amizade e reconciliação.",
    sortOrder: 30,
    safetyClass: "none",
  },
  {
    slug: "trabalho-desemprego",
    name: "Trabalho e desemprego",
    description: "Trabalho, vocação e busca por emprego.",
    sortOrder: 40,
    safetyClass: "finance",
  },
  {
    slug: "financas",
    name: "Finanças",
    description: "Necessidades materiais e provisão.",
    sortOrder: 50,
    safetyClass: "finance",
  },
  {
    slug: "dependencia",
    name: "Dependência",
    description: "Dependências e recuperação.",
    sortOrder: 60,
    safetyClass: "addiction",
  },
  {
    slug: "luto",
    name: "Luto",
    description: "Perdas e consolação.",
    sortOrder: 70,
    safetyClass: "grief",
  },
  {
    slug: "sofrimento-emocional",
    name: "Sofrimento emocional",
    description: "Ansiedade, tristeza profunda e crises emocionais.",
    sortOrder: 80,
    safetyClass: "emotional_crisis",
  },
  {
    slug: "vida-espiritual",
    name: "Vida espiritual",
    description: "Crescimento na fé e caminhada com Deus.",
    sortOrder: 90,
    safetyClass: "none",
  },
  {
    slug: "gratidao",
    name: "Gratidão",
    description: "Ações de graças e testemunhos de cuidado.",
    sortOrder: 100,
    safetyClass: "none",
  },
  {
    slug: "outros",
    name: "Outros",
    description: "Situações que não se encaixam nas demais categorias.",
    sortOrder: 110,
    safetyClass: "none",
  },
]

/** Upsert idempotente por slug. */
export async function seedCategoriesIdempotent(categories: CategorySeed[] = INITIAL_CATEGORIES) {
  const results = []
  for (const category of categories) {
    const row = await prisma.prayerRequestCategory.upsert({
      where: { slug: category.slug },
      create: {
        slug: category.slug,
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
        active: true,
        safetyClass: category.safetyClass,
      },
      update: {
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
        safetyClass: category.safetyClass,
        active: true,
      },
    })
    results.push(row)
  }
  return results
}

export function categorySeedFingerprint(categories: CategorySeed[] = INITIAL_CATEGORIES) {
  return createHash("sha256").update(JSON.stringify(categories)).digest("hex")
}
