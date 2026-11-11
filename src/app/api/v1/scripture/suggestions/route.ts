import { failure, ok } from "@/lib/api/http"
import { requireUserApi } from "@/lib/auth/session"
import { listScriptureSuggestions } from "@/modules/scripture"

export async function GET(request: Request) {
  const { error } = await requireUserApi()
  if (error) return error

  const url = new URL(request.url)
  const categoryId = url.searchParams.get("categoryId")?.trim() || undefined
  const categorySlug = url.searchParams.get("category")?.trim() || undefined

  try {
    const suggestions = await listScriptureSuggestions({ categoryId, categorySlug })
    return ok({ suggestions })
  } catch {
    return failure(500, "Não foi possível carregar sugestões bíblicas.")
  }
}
