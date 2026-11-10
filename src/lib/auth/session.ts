import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { isAdminRole } from "@/lib/auth/policy"
import { failure } from "@/lib/api/http"
import { prisma } from "@/lib/db/prisma"

export async function readSession() {
  return auth.api.getSession({
    headers: await headers(),
  })
}

export async function requireUser() {
  const session = await readSession()
  if (!session) redirect("/login")
  return session
}

export async function requireUserApi() {
  const session = await readSession()
  if (!session) return { session: null, error: failure(401, "Não autorizado.") }
  return { session, error: null }
}

export async function requireAdminApi() {
  const session = await readSession()
  if (!session) return { session: null, error: failure(401, "Não autorizado.") }
  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, banned: true },
  })
  if (!actor || actor.banned || !isAdminRole(actor.role)) {
    return { session: null, error: failure(403, "Acesso negado.") }
  }
  return { session, error: null }
}
