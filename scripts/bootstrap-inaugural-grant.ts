/**
 * BOOT-01 — concessão excepcional de elegibilidade inaugural (admin_grant).
 *
 * Dry-run por padrão. Não executa no Preview até autorização explícita do proprietário.
 *
 * Uso local:
 *   npx tsx scripts/bootstrap-inaugural-grant.ts --env=local --founder=<userId>
 *
 * Aplicar (após autorização):
 *   npx tsx scripts/bootstrap-inaugural-grant.ts --env=local --founder=<userId> --confirm=OWNER_AUTHORIZED
 *
 * Preview remoto (somente com autorização explícita + ALLOW_REMOTE_DB_WRITE=true):
 *   ALLOW_REMOTE_DB_WRITE=true npx tsx scripts/bootstrap-inaugural-grant.ts --env=preview --founder=<userId> --confirm=OWNER_AUTHORIZED
 */
import { config as loadEnv } from "dotenv"
import { grantInauguralAdminEligibility, inspectCommunityBootstrapState } from "../src/modules/bootstrap"
import { prisma } from "../src/lib/db/prisma"
import { parseDatabaseTarget, resolveDirectDatabaseUrl } from "../src/lib/db/connection"
import { assertDatabaseWriteAllowed, redactDatabaseTarget } from "../src/lib/db/guards"

loadEnv({ path: ".env.local", quiet: true })
loadEnv({ path: ".env", quiet: true })

function argValue(name: string): string | undefined {
  const prefix = `--${name}=`
  const hit = process.argv.find((a) => a.startsWith(prefix))
  return hit ? hit.slice(prefix.length) : undefined
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`)
}

async function main() {
  const declaredEnvironment = (argValue("env") || "local") as "preview" | "local"
  const founderUserId = argValue("founder")
  const confirm = argValue("confirm")
  const apply = hasFlag("apply") || confirm === "OWNER_AUTHORIZED"
  const ownerAuthorized = confirm === "OWNER_AUTHORIZED"

  if (declaredEnvironment !== "preview" && declaredEnvironment !== "local") {
    throw new Error("Use --env=local ou --env=preview.")
  }
  if (process.env.VERCEL_ENV === "production" || declaredEnvironment === ("production" as string)) {
    throw new Error("BOOT-01 recusado em Production.")
  }
  if (!founderUserId || founderUserId.length < 8) {
    throw new Error("Informe --founder=<userId> (ID da conta fundadora).")
  }

  const direct = resolveDirectDatabaseUrl()
  const target = parseDatabaseTarget(direct.url, direct.name)
  console.info("BOOT-01 bootstrap-inaugural-grant")
  console.info("db target", redactDatabaseTarget(target))
  console.info("mode", apply && ownerAuthorized ? "APPLY" : "DRY_RUN")
  console.info("declaredEnvironment", declaredEnvironment)
  console.info("founderUserIdPrefix", founderUserId.slice(0, 8))

  const inspection = await inspectCommunityBootstrapState(prisma)
  console.info("inspection", inspection)

  if (!apply || !ownerAuthorized) {
    console.info(
      JSON.stringify(
        {
          status: "dry_run",
          wouldAttemptGrant: true,
          blockedIf: [
            !ownerAuthorized ? "missing --confirm=OWNER_AUTHORIZED" : null,
            inspection.communityInitialized ? "community_already_initialized" : null,
            inspection.realRequestCount > 0 ? "real_requests_exist" : null,
          ].filter(Boolean),
          nextStep:
            "Após autorização do proprietário, rode com --confirm=OWNER_AUTHORIZED (e ALLOW_REMOTE_DB_WRITE=true se Preview remoto).",
        },
        null,
        2,
      ),
    )
    return
  }

  // Escrita: local autorizado OU Preview remoto com ALLOW_REMOTE_DB_WRITE=true
  assertDatabaseWriteAllowed()

  const result = await grantInauguralAdminEligibility(prisma, {
    founderUserId,
    actorUserId: founderUserId,
    ownerAuthorized: true,
    declaredEnvironment,
    correlationId: `boot01_${Date.now()}`,
  })

  console.info(
    JSON.stringify(
      {
        result: {
          status: result.status,
          reason: "reason" in result ? result.reason : undefined,
          eligibilityIdPrefix:
            "eligibilityId" in result ? result.eligibilityId.slice(0, 8) : undefined,
          inspection: result.inspection,
        },
        reminder:
          "Pedido inaugural deve ser criado pela UI /pedir (ex.: título sugerido «Orem pelo início desta comunidade»). Não inserir pedido direto na tabela.",
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
