/**
 * UI-05D.1R — preflight RO do catálogo bíblico no Preview.
 * Não escreve. Confere fingerprint e contagens vs catálogo oficial.
 *
 * Uso:
 *   npx tsx scripts/preflight-scripture-preview.ts path/to/.env.preview
 */
import crypto from "node:crypto"
import { config as loadEnv } from "dotenv"
import pg from "pg"
import { OFFICIAL_SCRIPTURE_EXPECTED } from "../src/modules/scripture/expected-counts"
import { SCRIPTURE_PASSAGES, SCRIPTURE_TOPICS } from "../src/modules/scripture/catalog"

const PREVIEW_FINGERPRINT = "8b65e5eb92cad1c8"
const PREVIEW_STORE = "store_xYaw5J0xe3Gb9T89"

async function main() {
  const envPath = process.argv[2]
  if (!envPath) {
    console.error("usage: npx tsx scripts/preflight-scripture-preview.ts <env-file>")
    process.exitCode = 1
    return
  }

  const env: Record<string, string | undefined> = {}
  loadEnv({ path: envPath, processEnv: env as NodeJS.ProcessEnv, quiet: true })

  const direct =
    env.DATABASE_URL_UNPOOLED ||
    env.DIRECT_URL ||
    env.DATABASE_URL ||
    env.POSTGRES_URL ||
    env.PRISMA_DATABASE_URL

  if (!direct || String(direct).includes("[SENSITIVE]")) {
    console.log(JSON.stringify({ ok: false, reason: "missing_preview_creds" }, null, 2))
    process.exitCode = 1
    return
  }

  function fingerprint(url: string) {
    const u = new URL(url)
    return crypto
      .createHash("sha256")
      .update(`${u.hostname}|${u.username}|${u.pathname}`)
      .digest("hex")
      .slice(0, 16)
  }

  const fp = fingerprint(direct)
  if (fp !== PREVIEW_FINGERPRINT) {
    console.log(
      JSON.stringify(
        { ok: false, reason: "fingerprint_mismatch", fp, expected: PREVIEW_FINGERPRINT },
        null,
        2,
      ),
    )
    process.exitCode = 1
    return
  }

  const client = new pg.Client({
    connectionString: direct,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20_000,
    query_timeout: 20_000,
  })

  await client.connect()
  try {
    const [passages, topics, categoryLinks, passageLinks, activePassages] = await Promise.all([
      client.query(`SELECT COUNT(*)::int AS n FROM scripture_passage`).then((r) => r.rows[0].n as number),
      client.query(`SELECT COUNT(*)::int AS n FROM scripture_topic`).then((r) => r.rows[0].n as number),
      client
        .query(`SELECT COUNT(*)::int AS n FROM category_scripture_topic`)
        .then((r) => r.rows[0].n as number),
      client
        .query(`SELECT COUNT(*)::int AS n FROM scripture_passage_topic`)
        .then((r) => r.rows[0].n as number),
      client
        .query(`SELECT COUNT(*)::int AS n FROM scripture_passage WHERE active = true`)
        .then((r) => r.rows[0].n as number),
    ])

    const missing = {
      passages: Math.max(0, OFFICIAL_SCRIPTURE_EXPECTED.passages - passages),
      topics: Math.max(0, OFFICIAL_SCRIPTURE_EXPECTED.topics - topics),
      categoryTopicLinks: Math.max(
        0,
        OFFICIAL_SCRIPTURE_EXPECTED.categoryTopicLinks - categoryLinks,
      ),
      passageTopicLinks: Math.max(
        0,
        OFFICIAL_SCRIPTURE_EXPECTED.passageTopicLinks - passageLinks,
      ),
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          writes: false,
          mode: "preflight-dry-run",
          storeExpected: PREVIEW_STORE,
          fingerprint: fp,
          inspectTargetMatchesWriteTarget: true,
          catalog: {
            passages: SCRIPTURE_PASSAGES.length,
            topics: SCRIPTURE_TOPICS.length,
          },
          current: { passages, activePassages, topics, categoryLinks, passageLinks },
          expectedAfterApply: OFFICIAL_SCRIPTURE_EXPECTED,
          missingAtLeast: missing,
          applyAuthorized: false,
          note: "Aguardar autorização explícita do proprietário para --apply no Preview.",
        },
        null,
        2,
      ),
    )
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
