import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Proteção leve de rotas autenticadas.
 * Autorização definitiva permanece no servidor (session.ts / API).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const protectedPrefixes = ["/account", "/encontrar"]
  const needsAuth = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
  if (!needsAuth) return NextResponse.next()

  const hasSession = request.cookies
    .getAll()
    .some((cookie) => cookie.name.includes("session_token"))

  if (!hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/account/:path*", "/encontrar", "/encontrar/:path*"],
}
