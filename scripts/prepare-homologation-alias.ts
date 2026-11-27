/**
 * UI-05D.1R — vínculo permanente do domínio de homologação ao git branch do PR #13.
 *
 * Uso:
 *   npx tsx scripts/prepare-homologation-alias.ts --check
 *   npx tsx scripts/prepare-homologation-alias.ts --apply
 *
 * Usa `vercel api` (autenticado pelo CLI) para ler/atualizar project domain.gitBranch.
 * Alias pontual (`vercel alias set`) não altera get_project_domain.
 * Preserva Better Auth em https://homologacao.oraora.ia.br e o banco Preview.
 * Não altera Production. Não faz merge.
 */
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const HOMOLOG_HOST = "homologacao.oraora.ia.br"
const PROJECT = "oraora"
const SCOPE = "alefeios-projects"
const BRANCH = "fix/ui-05d-1-prayer-reliability"
const BETTER_AUTH_ORIGIN = `https://${HOMOLOG_HOST}`

const apply = process.argv.includes("--apply")

function readProjectMeta() {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(process.cwd(), ".vercel", "project.json"), "utf8"),
    ) as { orgId?: string; projectId?: string; projectName?: string }
  } catch {
    return {}
  }
}

function vercelApi(endpoint: string, extraArgs: string[] = []) {
  const npxBin = process.platform === "win32" ? "npx.cmd" : "npx"
  const out = execFileSync(
    npxBin,
    ["vercel", "api", endpoint, "--scope", SCOPE, "--raw", ...extraArgs],
    { encoding: "utf8", shell: process.platform === "win32" },
  ).trim()
  // CLI pode prefixar warnings; extrai o último objeto JSON.
  const start = out.indexOf("{")
  const end = out.lastIndexOf("}")
  if (start < 0 || end < start) {
    throw new Error(`vercel api sem JSON: ${out.slice(0, 200)}`)
  }
  return JSON.parse(out.slice(start, end + 1)) as Record<string, unknown>
}

async function main() {
  const meta = readProjectMeta()
  const teamId = process.env.VERCEL_TEAM_ID?.trim() || meta.orgId || ""
  const teamQs = teamId ? `?teamId=${encodeURIComponent(teamId)}` : ""

  console.info(
    JSON.stringify(
      {
        host: HOMOLOG_HOST,
        project: PROJECT,
        targetGitBranch: BRANCH,
        betterAuthUrl: BETTER_AUTH_ORIGIN,
        mode: apply ? "apply" : "check",
        teamIdPresent: Boolean(teamId),
        productionWrites: 0,
        mergeMain: false,
      },
      null,
      2,
    ),
  )

  const before = vercelApi(`/v9/projects/${PROJECT}/domains/${HOMOLOG_HOST}${teamQs}`)
  console.info("get_project_domain", {
    name: before.name ?? null,
    gitBranch: before.gitBranch ?? null,
    verified: before.verified ?? null,
    redirect: before.redirect ?? null,
  })

  const aligned = before.gitBranch === BRANCH
  console.info("git_branch_aligned", aligned)

  if (!apply) {
    console.info(
      aligned
        ? "check_ok: domínio já aponta para a branch do PR #13."
        : `check_drift: gitBranch atual=${String(before.gitBranch ?? "null")}; desejado=${BRANCH}. Rode --apply.`,
    )
    return
  }

  if (aligned) {
    console.info("apply_noop: já alinhado.")
    return
  }

  const patched = vercelApi(`/v9/projects/${PROJECT}/domains/${HOMOLOG_HOST}${teamQs}`, [
    "-X",
    "PATCH",
    "-F",
    `gitBranch=${BRANCH}`,
  ])
  console.info("patched_project_domain", {
    name: patched.name ?? null,
    gitBranch: patched.gitBranch ?? null,
  })

  const verify = vercelApi(`/v9/projects/${PROJECT}/domains/${HOMOLOG_HOST}${teamQs}`)
  console.info("get_project_domain_after", {
    name: verify.name ?? null,
    gitBranch: verify.gitBranch ?? null,
  })
  if (verify.gitBranch !== BRANCH) {
    throw new Error(
      `Domínio não ficou na branch desejada (ainda ${String(verify.gitBranch ?? "null")}).`,
    )
  }

  // Mantém o alias de deployment alinhado ao branch URL estável.
  try {
    const npxBin = process.platform === "win32" ? "npx.cmd" : "npx"
    execFileSync(
      npxBin,
      [
        "vercel",
        "alias",
        "set",
        "oraora-git-fix-ui-05d-1-prayer-reliability-alefeios-projects.vercel.app",
        HOMOLOG_HOST,
        "--scope",
        SCOPE,
      ],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], shell: process.platform === "win32" },
    )
    console.info("alias_set_ok", HOMOLOG_HOST)
  } catch (error) {
    console.warn(
      "alias_set_warn",
      error instanceof Error ? error.message : error,
    )
  }

  console.info("better_auth_origin_preserved", BETTER_AUTH_ORIGIN)
  console.info("preview_db_isolation", "unchanged")
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
