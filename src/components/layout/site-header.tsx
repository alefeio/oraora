"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BrandLogo } from "@/components/brand/logo"
import { ButtonLink } from "@/components/ui/button"

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

function navLinkClass(active: boolean) {
  return [
    "inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-sm font-semibold no-underline sm:px-3",
    active
      ? "text-primary shadow-[inset_0_-2px_0_var(--brand-gold)]"
      : "text-text-secondary hover:text-primary",
  ]
    .filter(Boolean)
    .join(" ")
}

export function SiteHeader({
  mode = "public",
}: {
  mode?: "public" | "app"
}) {
  const pathname = usePathname() || "/"

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="layout-shell flex flex-col gap-1 py-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-h-[var(--header-h)] items-center">
          <BrandLogo size="header" priority className="shrink-0" />
        </div>
        <nav
          className="flex w-full min-w-0 flex-nowrap items-center justify-between gap-1 sm:w-auto sm:justify-end sm:gap-2"
          aria-label="Principal"
        >
          {mode === "public" ? (
            <>
              <Link
                href="/encontrar"
                aria-current={isActivePath(pathname, "/encontrar") ? "page" : undefined}
                className={navLinkClass(isActivePath(pathname, "/encontrar"))}
              >
                Encontrar
              </Link>
              <ButtonLink href="/login" variant="ghost" size="sm" className="shrink-0 px-2 sm:px-3">
                Entrar
              </ButtonLink>
              <ButtonLink href="/signup" size="sm" className="shrink-0 px-2 sm:px-3">
                Criar conta
              </ButtonLink>
            </>
          ) : (
            <>
              <ButtonLink
                href="/encontrar"
                variant="ghost"
                size="sm"
                className="shrink-0 px-2 sm:px-3"
                aria-current={isActivePath(pathname, "/encontrar") ? "page" : undefined}
              >
                Encontrar
              </ButtonLink>
              <ButtonLink
                href="/pedir"
                variant="secondary"
                size="sm"
                className="shrink-0 px-2 sm:px-3"
                aria-current={isActivePath(pathname, "/pedir") ? "page" : undefined}
              >
                Pedir
              </ButtonLink>
              <ButtonLink
                href="/account"
                size="sm"
                className="shrink-0 px-2 sm:px-3"
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
