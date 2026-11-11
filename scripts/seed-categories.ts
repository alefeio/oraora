import { config as loadEnv } from "dotenv"
import { assertDatabaseWriteAllowed, redactDatabaseTarget } from "../src/lib/db/guards"
import { prisma } from "../src/lib/db/prisma"
import { seedCategoriesIdempotent } from "../src/modules/prayer-requests/categories"

loadEnv({ path: ".env.local", quiet: true })
loadEnv({ path: ".env", quiet: true })

async function main() {
  const target = assertDatabaseWriteAllowed()
  console.info("seed target", redactDatabaseTarget(target))
  const rows = await seedCategoriesIdempotent()
  console.info(`categories upserted: ${rows.length}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
