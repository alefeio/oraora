import { failure, ok } from "@/lib/api/http"
import { requireUserApi } from "@/lib/auth/session"
import { listActiveCategories } from "@/modules/prayer-requests"

export async function GET() {
  const { error } = await requireUserApi()
  if (error) return error

  try {
    const categories = await listActiveCategories()
    return ok({ categories })
  } catch {
    return failure(500, "Não foi possível listar as categorias.")
  }
}
