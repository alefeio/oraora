"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BrandLogo } from "@/components/brand/logo"
import { ButtonLink } from "@/components/ui/button"

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function SiteHeader({
  mode = "public",
}: {
  mode?: "public" | "app"
}) {
  const pathname = usePathname() || "/"

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="layout-shell flex min-h-[var(--header-h)] items-center justify-between gap-x-3 gap-y-2 py-1.5">
        <BrandLogo size="header" priority className="shrink-0" />
        <nav
          className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1.5 sm:gap-2"
          aria-label="Principal"
        >
          {mode === "public" ? (
            <>
              <Link
                href="/encontrar"
                aria-current={isActivePath(pathname, "/encontrar") ? "page" : undefined}
                className={[
                  "inline-flex min-h-11 items-center px-3 text-sm font-semibold text-text-secondary no-underline hover:text-primary",
                  isActivePath(pathname, "/encontrar")
                    ? "text-primary shadow-[inset_0_-2px_0_var(--brand-gold)]"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                Encontrar
              </Link>
              <ButtonLink href="/login" variant="ghost" size="sm">
                Entrar
              </ButtonLink>
              <ButtonLink href="/signup" size="sm">
                Criar conta
              </ButtonLink>
            </>
          ) : (
            <>
              <ButtonLink
                href="/encontrar"
                variant="ghost"
                size="sm"
                aria-current={isActivePath(pathname, "/encontrar") ? "page" : undefined}
              >
                Encontrar
              </ButtonLink>
              <ButtonLink
                href="/pedir"
                variant="secondary"
                size="sm"
                aria-current={isActivePath(pathname, "/pedir") ? "page" : undefined}
              >
                Pedir
              </ButtonLink>
              <ButtonLink
                href="/account"
                size="sm"
                aria-current={isActivePath(pathname, "/account") ? "page" : undefined}
              >
                Conta
              </ButtonLink>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
