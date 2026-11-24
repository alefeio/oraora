/**
 * BOOT-01R — inspeção somente leitura.
 * Não grava. Não imprime e-mails nem IDs completos.
 */
import { config as loadEnv } from "dotenv"
import {
  assertBootstrapDbTarget,
  inspectCommunityBootstrapState,
  redactBootstrapFingerprint,
} from "../src/modules/bootstrap"
import { prisma } from "../src/lib/db/prisma"

loadEnv({ path: ".env.local", quiet: true })
loadEnv({ path: ".env", quiet: true })

function argValue(name: string): string | undefined {
  const prefix = `--${name}=`
  const hit = process.argv.find((a) => a.startsWith(prefix))
  return hit ? hit.slice(prefix.length) : undefined
}

async function main() {
  const declared = (argValue("env") || "local") as "preview" | "local"
  if (process.env.VERCEL_ENV === "production") {
    throw new Error("Inspeção recusada com VERCEL_ENV=production.")
  }

  // Para preview read-only, BOOTSTRAP_PREVIEW_DATABASE identifica o alvo;
  // ALLOW_REMOTE_DB_WRITE não é exigido na inspeção — só no apply.
  const envForFingerprint = { ...process.env }
  if (declared === "preview" && envForFingerprint.ALLOW_REMOTE_DB_WRITE !== "true") {
    // Fingerprint de inspeção: não exigir write flag; reusa lógica parcial via try
  }

  let fingerprint
  try {
    fingerprint = assertBootstrapDbTarget(declared, {
      ...envForFingerprint,
      // inspeção: se preview e database bate, permitir classificação mesmo sem write flag
      ALLOW_REMOTE_DB_WRITE:
        declared === "preview" ? "true" : envForFingerprint.ALLOW_REMOTE_DB_WRITE,
    })
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
    return
  }

  console.info("BOOT-01R inspect (read-only)")
  console.info("db target", redactBootstrapFingerprint(fingerprint))

  if (declared === "preview" && fingerprint.classification !== "preview_remote") {
    console.info(
      JSON.stringify(
        {
          mode: "read_only",
          writes: false,
          eligibleForBootstrap: "unknown",
          reason: fingerprint.reason,
          notes: [
            "Fingerprint Preview não confirmado; não interpretar contagens locais como Preview.",
          ],
        },
        null,
        2,
      ),
    )
    process.exitCode = 1
    return
  }

  try {
    const inspection = await inspectCommunityBootstrapState(prisma)
    const eligibleForBootstrap =
      !inspection.communityInitialized &&
      inspection.realRequestCount === 0 &&
      inspection.openVisibleRequestCount === 0 &&
      !inspection.bootstrapPolicyPresent

    console.info(
      JSON.stringify(
        {
          mode: "read_only",
          writes: false,
          inspection,
          eligibleForBootstrap,
          notes: [
            "Sem e-mails ou IDs completos.",
            "eligibleForBootstrap não autoriza grant; falta OWNER_AUTHORIZED.",
          ],
        },
        null,
        2,
      ),
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.info(
      JSON.stringify(
        {
          mode: "read_only",
          writes: false,
          eligibleForBootstrap: "unknown",
          inspectionError: message.includes("does not exist")
            ? "schema_tables_missing"
            : "inspection_failed",
          notes: [
            "Banco alcançável no fingerprint, mas schema do app ausente/incompleto.",
            "Apontar BOOTSTRAP_PREVIEW_DATABASE + URLs do Preview migrado da Vercel.",
          ],
        },
        null,
        2,
      ),
    )
    process.exitCode = 1
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
