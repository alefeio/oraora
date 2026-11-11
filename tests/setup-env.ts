import { config as loadEnv } from "dotenv"
import { assertTestRuntimeIsLocal } from "../src/lib/db/guards"

loadEnv({ path: ".env.local", quiet: true })
loadEnv({ path: ".env", quiet: true })

// Garante que testes nunca usem pooled/remoto mesmo se .env.local misturar integração Vercel.
if (!process.env.RUNTIME_DATABASE_URL && process.env.DATABASE_URL) {
  // Preferência explícita já tratada no resolvedor; aqui só validamos.
}

try {
  assertTestRuntimeIsLocal()
} catch (error) {
  console.error("[tests] Isolamento de banco falhou:", error)
  throw error
}
