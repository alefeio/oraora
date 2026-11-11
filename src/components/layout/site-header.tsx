import Link from "next/link"
import { BrandLogo } from "@/components/brand/logo"
import { ButtonLink } from "@/components/ui/button"

export function SiteHeader({
  mode = "public",
}: {
  mode?: "public" | "app"
}) {
  return (
    <header className="border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <BrandLogo size="sm" priority />
        <nav className="flex flex-wrap items-center justify-end gap-2" aria-label="Principal">
          {mode === "public" ? (
            <>
              <Link
                href="/encontrar"
                className="hidden text-sm font-medium text-text-secondary hover:text-primary sm:inline"
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
              <ButtonLink href="/encontrar" variant="ghost" size="sm">
                Encontrar
              </ButtonLink>
              <ButtonLink href="/pedir" variant="secondary" size="sm">
                Pedir
              </ButtonLink>
              <ButtonLink href="/account" size="sm">
                Conta
              </ButtonLink>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
