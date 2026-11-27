/**
 * UI-05D.1 — insere apenas passagens/tópicos/vínculos ausentes do catálogo oficial.
 * Não atualiza existentes. Não chama seed de categorias.
 *
 * Uso:
 *   npx tsx scripts/insert-missing-scripture.ts          # dry-run (padrão)
 *   npx tsx scripts/insert-missing-scripture.ts --apply  # escrita (exige guardas)
 *
 * Preview compartilhado: NÃO executar sem autorização explícita do proprietário.
 */
import { config as loadEnv } from "dotenv"
import { assertDatabaseWriteAllowed, redactDatabaseTarget } from "../src/lib/db/guards"
import { prisma } from "../src/lib/db/prisma"
import { SCRIPTURE_PASSAGES, SCRIPTURE_TOPICS } from "../src/modules/scripture/catalog"
import { insertMissingScriptureOnly } from "../src/modules/scripture/insert-missing"

loadEnv({ path: ".env.local", quiet: true })
loadEnv({ path: ".env", quiet: true })

async function main() {
  const apply = process.argv.includes("--apply")
  const target = assertDatabaseWriteAllowed()
  console.info("target", redactDatabaseTarget(target))
  console.info("mode", apply ? "apply" : "dry-run")
  console.info("catalog", {
    passages: SCRIPTURE_PASSAGES.length,
    topics: SCRIPTURE_TOPICS.length,
  })

  if (!apply) {
    const [passages, topics, categoryLinks, passageLinks] = await Promise.all([
      prisma.scripturePassage.count(),
      prisma.scriptureTopic.count(),
      prisma.categoryScriptureTopic.count(),
      prisma.scripturePassageTopic.count(),
    ])
    console.info("current_counts", { passages, topics, categoryLinks, passageLinks })
    console.info("dry-run: nenhuma escrita. Passe --apply para inserir ausentes.")
    return
  }

  const result = await insertMissingScriptureOnly(prisma)
  console.info("insert_missing_result", result)
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
