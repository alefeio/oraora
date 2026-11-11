import type { ReactNode } from "react"
import Link from "next/link"
import { BrandLogo } from "@/components/brand/logo"
import { Card } from "@/components/ui/card"

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
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col gap-6 px-4 py-12 sm:px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <BrandLogo size="md" priority />
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-primary">{title}</h1>
          {subtitle ? <p className="text-sm text-text-secondary">{subtitle}</p> : null}
        </div>
      </div>
      <Card>{children}</Card>
      {footer}
    </main>
  )
}

export function AuthTextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-medium text-primary underline-offset-2 hover:underline">
      {children}
    </Link>
  )
}
