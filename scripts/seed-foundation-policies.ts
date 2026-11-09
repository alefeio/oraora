import { config as loadEnv } from "dotenv"
import { assertDatabaseWriteAllowed, redactDatabaseTarget } from "../src/lib/db/guards"
import { prisma } from "../src/lib/db/prisma"

loadEnv({ path: ".env.local", quiet: true })
loadEnv({ path: ".env", quiet: true })

async function main() {
  const target = assertDatabaseWriteAllowed()
  console.info("seed target", redactDatabaseTarget(target))

  await prisma.policyDocument.upsert({
    where: { domain_version: { domain: "product", version: 1 } },
    create: {
      domain: "product",
      version: 1,
      status: "active",
      activatedAt: new Date(),
      document: {
        displayName: "Ora por Mim",
        displayNameProvisional: true,
        workingTitle: "Rede de Intercessão Solidária",
      },
    },
    update: {
      status: "active",
      activatedAt: new Date(),
      document: {
        displayName: "Ora por Mim",
        displayNameProvisional: true,
        workingTitle: "Rede de Intercessão Solidária",
      },
    },
  })

  await prisma.policyDocument.upsert({
    where: { domain_version: { domain: "feed", version: 1 } },
    create: {
      domain: "feed",
      version: 1,
      status: "draft",
      document: {
        note: "Hipóteses do PDF — NÃO ativar como verdade definitiva sem validação.",
        prayerCountBands: [
          { min: 0, max: 0, weight: null },
          { min: 1, max: 2, weight: null },
          { min: 3, max: 5, weight: null },
          { min: 6, max: null, weight: null },
        ],
        ageBandsHours: [
          { maxAgeHours: 72, weight: null },
          { maxAgeHours: 168, weight: null },
          { maxAgeHours: null, leavePrimaryQueue: true },
        ],
      },
    },
    update: {},
  })

  console.info("foundation policies upserted")
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
