/**
 * UI-05D.1R — prepara / verifica alias de homologação → PR #13.
 *
 * Uso:
 *   npx tsx scripts/prepare-homologation-alias.ts --check
 *   npx tsx scripts/prepare-homologation-alias.ts --apply   # requer confirmação operacional
 *
 * Não altera Production. Não faz merge.
 */
import { execFileSync } from "node:child_process"

const HOMOLOG_HOST = "homologacao.oraora.ia.br"
const PROJECT = "oraora"
const SCOPE = "alefeios-projects"
const BRANCH = "fix/ui-05d-1-prayer-reliability"

const apply = process.argv.includes("--apply")
const check = process.argv.includes("--check") || !apply

function sh(bin: string, args: string[]) {
  return execFileSync(bin, args, { encoding: "utf8" }).trim()
}

function main() {
  console.info(
    JSON.stringify(
      {
        host: HOMOLOG_HOST,
        project: PROJECT,
        scope: SCOPE,
        targetBranch: BRANCH,
        mode: apply ? "apply" : "check",
        betterAuthUrl: `https://${HOMOLOG_HOST}`,
        nextPublicAppUrl: `https://${HOMOLOG_HOST}`,
        productionWrites: 0,
        mergeMain: false,
      },
      null,
      2,
    ),
  )

  try {
    const domains = sh("npx", ["vercel", "domains", "ls", "--scope", SCOPE])
    console.info("domains_ls_excerpt", domains.split("\n").slice(0, 40).join("\n"))
  } catch (error) {
    console.warn("domains_ls_failed", error instanceof Error ? error.message : error)
  }

  if (check && !apply) {
    console.info(
      "check_only: para aplicar o alias ao deployment do PR #13, rode com --apply após validar o deployment Preview.",
    )
    return
  }

  console.info(
    [
      "apply_plan:",
      `1) Localizar deployment da branch ${BRANCH} / PR #13`,
      `2) vercel alias set <deployment-url> ${HOMOLOG_HOST} --scope ${SCOPE} --yes`,
      `3) Confirmar BETTER_AUTH_URL e NEXT_PUBLIC_APP_URL = https://${HOMOLOG_HOST}`,
      "4) Smoke health + login Conta B + /account/oracoes",
    ].join("\n"),
  )
}

main()
