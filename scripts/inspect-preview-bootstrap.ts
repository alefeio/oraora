/**
 * BOOT-01 — inspeção somente leitura do estado de bootstrap da comunidade.
 * Não grava no banco. Não imprime e-mails nem IDs completos de usuários.
 *
 * Uso:
 *   npx tsx scripts/inspect-preview-bootstrap.ts
 */
import { config as loadEnv } from "dotenv"
import { inspectCommunityBootstrapState } from "../src/modules/bootstrap"
import { prisma } from "../src/lib/db/prisma"
import { parseDatabaseTarget, resolveRuntimeDatabaseUrl } from "../src/lib/db/connection"
import { redactDatabaseTarget } from "../src/lib/db/guards"

loadEnv({ path: ".env.local", quiet: true })
loadEnv({ path: ".env", quiet: true })

async function main() {
  const runtime = resolveRuntimeDatabaseUrl()
  const target = parseDatabaseTarget(runtime.url, runtime.name)
  const redacted = redactDatabaseTarget(target)

  console.info("BOOT-01 inspect (read-only)")
  console.info("db target", {
    ...redacted,
    connectionName: runtime.name,
    pooled: runtime.pooled,
    vercelEnv: process.env.VERCEL_ENV ?? null,
  })

  const inspection = await inspectCommunityBootstrapState(prisma)
  console.info(
    JSON.stringify(
      {
        mode: "read_only",
        inspection,
        notes: [
          "Nenhum e-mail ou ID completo de usuário é exibido.",
          "communityInitialized=true quando há pedido real ou audit de bootstrap.",
        ],
      },
      null,
      2,
    ),
  )
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
