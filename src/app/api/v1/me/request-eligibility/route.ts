import { failure, ok } from "@/lib/api/http"
import { requireUserApi } from "@/lib/auth/session"
import { getRequestEligibilitySnapshot } from "@/modules/reciprocity"

export async function GET() {
  const { session, error } = await requireUserApi()
  if (error) return error

  try {
    const eligibility = await getRequestEligibilitySnapshot(session!.user.id)
    return ok({ eligibility })
  } catch {
    return failure(500, "Não foi possível consultar a elegibilidade.")
  }
}
