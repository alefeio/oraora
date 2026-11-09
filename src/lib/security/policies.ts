import { prisma } from "@/lib/db/prisma"

export const POLICY_DOMAINS = [
  "product",
  "feed",
  "validation",
  "financial",
  "safety",
] as const

export type PolicyDomain = (typeof POLICY_DOMAINS)[number]

export async function getActivePolicy(domain: PolicyDomain) {
  return prisma.policyDocument.findFirst({
    where: { domain, status: "active" },
    orderBy: { version: "desc" },
  })
}

export async function upsertDraftPolicy(input: {
  domain: PolicyDomain
  version: number
  document: Record<string, unknown>
}) {
  const document = input.document as object
  return prisma.policyDocument.upsert({
    where: {
      domain_version: {
        domain: input.domain,
        version: input.version,
      },
    },
    create: {
      domain: input.domain,
      version: input.version,
      status: "draft",
      document,
    },
    update: {
      document,
      status: "draft",
    },
  })
}
