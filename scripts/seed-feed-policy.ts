import { config as loadEnv } from "dotenv"
import { assertDatabaseWriteAllowed, redactDatabaseTarget } from "../src/lib/db/guards"
import { prisma } from "../src/lib/db/prisma"

loadEnv({ path: ".env.local", quiet: true })
loadEnv({ path: ".env", quiet: true })

/**
 * Política de feed versionada.
 * Números = hipóteses do PDF; editáveis sem redeploy de código.
 */
const FEED_POLICY_V1 = {
  note: "Hipóteses do PDF — ajustáveis. Não tratar como verdade definitiva.",
  hypotheses: true,
  prayerCountBands: [
    { min: 0, max: 0, priorityRank: 0 },
    { min: 1, max: 2, priorityRank: 1 },
    { min: 3, max: 5, priorityRank: 2 },
    { min: 6, max: null, priorityRank: 3 },
  ],
  ageBandsHours: [
    { maxAgeHours: 72, priorityRank: 0 },
    { maxAgeHours: 168, priorityRank: 1 },
    { maxAgeHours: null, priorityRank: 2, leavePrimaryQueue: true },
  ],
}

async function main() {
  const target = assertDatabaseWriteAllowed()
  console.info("seed target", redactDatabaseTarget(target))

  await prisma.policyDocument.upsert({
    where: { domain_version: { domain: "feed", version: 1 } },
    create: {
      domain: "feed",
      version: 1,
      status: "active",
      activatedAt: new Date(),
      document: FEED_POLICY_V1,
    },
    update: {
      status: "active",
      activatedAt: new Date(),
      document: FEED_POLICY_V1,
    },
  })

  console.info("feed policy v1 activated (hypotheses)")
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
