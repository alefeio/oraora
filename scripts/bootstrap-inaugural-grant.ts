/**
 * BOOT-01R — concessão excepcional de elegibilidade inaugural (admin_grant).
 *
 * Dry-run por padrão. Não executa no Preview até autorização explícita do proprietário.
 *
 * Local:
 *   npx tsx scripts/bootstrap-inaugural-grant.ts --env=local --founder=<userId>
 *
 * Apply local:
 *   npx tsx scripts/bootstrap-inaugural-grant.ts --env=local --founder=<userId> --confirm=OWNER_AUTHORIZED
 *
 * Preview (após autorização + identificação explícita do banco):
 *   BOOTSTRAP_PREVIEW_DATABASE=<dbname> ALLOW_REMOTE_DB_WRITE=true \
 *   npx tsx scripts/bootstrap-inaugural-grant.ts --env=preview --founder=<userId> \
 *     --operator=system:owner-cli --confirm=OWNER_AUTHORIZED
 *
 * Operador admin verificado (opcional):
 *   --operator-admin=<adminUserId>
 */
import { config as loadEnv } from "dotenv"
import {
  assertBootstrapDbTarget,
  grantInauguralAdminEligibility,
  inspectCommunityBootstrapState,
  redactBootstrapFingerprint,
  type BootstrapOperator,
} from "../src/modules/bootstrap"
import { prisma } from "../src/lib/db/prisma"
import { assertDatabaseWriteAllowed } from "../src/lib/db/guards"

loadEnv({ path: ".env.local", quiet: true })
loadEnv({ path: ".env", quiet: true })

function argValue(name: string): string | undefined {
  const prefix = `--${name}=`
  const hit = process.argv.find((a) => a.startsWith(prefix))
  return hit ? hit.slice(prefix.length) : undefined
}

async function main() {
  const declaredEnvironment = (argValue("env") || "local") as "preview" | "local"
  const founderUserId = argValue("founder")
  const confirm = argValue("confirm")
  const ownerAuthorized = confirm === "OWNER_AUTHORIZED"
  const operatorAdminId = argValue("operator-admin")
  const operatorSystem = argValue("operator") || "system:boot-01-cli"

  if (declaredEnvironment !== "preview" && declaredEnvironment !== "local") {
    throw new Error("Use --env=local ou --env=preview.")
  }
  if (process.env.VERCEL_ENV === "production") {
    throw new Error("BOOT-01R recusado em Production.")
  }
  if (!founderUserId || founderUserId.length < 8) {
    throw new Error("Informe --founder=<userId> (ID da conta fundadora).")
  }

  const fingerprint = assertBootstrapDbTarget(declaredEnvironment)
  console.info("BOOT-01R bootstrap-inaugural-grant")
  console.info("db target", redactBootstrapFingerprint(fingerprint))
  console.info("mode", ownerAuthorized ? "APPLY_REQUESTED" : "DRY_RUN")
  console.info("founderUserIdPrefix", founderUserId.slice(0, 8))

  let inspection: Awaited<ReturnType<typeof inspectCommunityBootstrapState>> | null = null
  let inspectionError: string | null = null
  try {
    inspection = await inspectCommunityBootstrapState(prisma)
    console.info("inspection", inspection)
  } catch (error) {
    inspectionError = error instanceof Error ? error.message : String(error)
    console.warn("inspection_unavailable", inspectionError)
  }

  const operator: BootstrapOperator = operatorAdminId
    ? { kind: "verified_admin", userId: operatorAdminId }
    : { kind: "system_operator", label: operatorSystem }

  if (!ownerAuthorized) {
    console.info(
      JSON.stringify(
        {
          status: "dry_run",
          wouldAttemptGrant: true,
          writes: false,
          operator,
          blockedIf: [
            "missing --confirm=OWNER_AUTHORIZED",
            !fingerprint.allowedForApply ? `db_target:${fingerprint.reason}` : null,
            inspection?.communityInitialized ? "community_already_initialized" : null,
            inspection && inspection.realRequestCount > 0 ? "real_requests_exist" : null,
            inspectionError ? "database_unreachable_for_inspection" : null,
          ].filter(Boolean),
          nextStep:
            "Após autorização: --confirm=OWNER_AUTHORIZED; Preview exige BOOTSTRAP_PREVIEW_DATABASE=<dbname> e ALLOW_REMOTE_DB_WRITE=true.",
        },
        null,
        2,
      ),
    )
    return
  }

  if (inspectionError) {
    throw new Error(`Inspeção obrigatória antes do apply falhou: ${inspectionError}`)
  }
  if (!fingerprint.allowedForApply) {
    throw new Error(`Alvo de banco rejeitado: ${fingerprint.reason}`)
  }

  // Fundador deve existir no mesmo banco da inspeção/runtime.
  const founder = await prisma.user.findUnique({ where: { id: founderUserId } })
  if (!founder || founder.banned) {
    throw new Error("Fundador ausente ou indisponível no banco inspecionado.")
  }

  assertDatabaseWriteAllowed()

  const result = await grantInauguralAdminEligibility(prisma, {
    founderUserId,
    operator,
    ownerAuthorized: true,
    declaredEnvironment,
    correlationId: `boot01r_${Date.now()}`,
    enforceDbTarget: true,
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
          dbTarget: "dbTarget" in result ? result.dbTarget : undefined,
        },
        reminder:
          "Pedido inaugural via UI /pedir. Beneficiário ≠ admin. Grant Preview só com autorização explícita.",
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
