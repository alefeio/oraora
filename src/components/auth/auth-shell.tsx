import type { ReactNode } from "react"
import Link from "next/link"
import { BrandLogo } from "@/components/brand/logo"

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-5 px-4 py-10 sm:px-6 sm:py-14">
      <section
        className="rounded-[var(--radius-lg)] border border-border bg-surface px-5 py-7 shadow-[var(--shadow-soft)] sm:px-8 sm:py-9"
        aria-labelledby="auth-shell-title"
      >
        <div className="mb-6 flex flex-col items-center gap-3 text-center sm:mb-7">
          <BrandLogo size="md" priority />
          <div className="space-y-1.5">
            <h1 id="auth-shell-title" className="text-2xl font-bold text-primary sm:text-[1.65rem]">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-sm leading-6 text-text-secondary">{subtitle}</p>
            ) : null}
          </div>
        </div>
        <div className="space-y-4">{children}</div>
      </section>
      {footer ? <div className="text-center">{footer}</div> : null}
    </main>
  )
}

export function AuthTextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-offset-4"
    >
      {children}
    </Link>
  )
}
