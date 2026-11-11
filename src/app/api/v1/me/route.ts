import { ok } from "@/lib/api/http"
import { requireUserApi } from "@/lib/auth/session"

export async function GET() {
  const { session, error } = await requireUserApi()
  if (error) return error

  return ok({
    user: {
      id: session!.user.id,
      name: session!.user.name,
      email: session!.user.email,
      emailVerified: session!.user.emailVerified,
      role: session!.user.role,
    },
  })
}
