import { Suspense } from "react"
import { CreateRequestForm } from "@/components/prayer/create-request-form"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { ButtonLink } from "@/components/ui/button"
import { requireUser } from "@/lib/auth/session"
import { PRODUCT_DISPLAY_NAME, PRODUCT_PRINCIPLE } from "@/lib/config/product"
import { listActiveCategories } from "@/modules/prayer-requests"
import { getRequestEligibilitySnapshot } from "@/modules/reciprocity"

export const metadata = {
  title: `Criar pedido · ${PRODUCT_DISPLAY_NAME}`,
  robots: { index: false, follow: false },
}

export default function PedirPage() {
  return (
    <Suspense
      fallback={<main className="layout-shell py-8 text-sm text-text-muted">Carregando…</main>}
    >
      <PedirContent />
    </Suspense>
  )
}

async function PedirContent() {
  const session = await requireUser()
  const [eligibility, categories] = await Promise.all([
    getRequestEligibilitySnapshot(session.user.id),
    listActiveCategories(),
  ])

  if (!eligibility.canPublish) {
    return (
      <>
        <SiteHeader mode="app" />
        <main className="layout-shell flex min-w-0 max-w-xl flex-col gap-6 py-10 sm:py-12">
          <header className="space-y-3">
            <p className="brand-kicker">
              <span className="brand-kicker-dot" aria-hidden />
              Pedir
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
              Antes de pedir
            </h1>
            <hr className="brand-rule" />
          </header>

          <p className="text-base leading-7 text-text-secondary">{eligibility.message}</p>

          <blockquote className="brand-principle text-sm leading-6 sm:text-base">
            {PRODUCT_PRINCIPLE}
          </blockquote>

          <ButtonLink href="/encontrar" size="lg" className="w-full sm:w-auto">
            Encontrar alguém para orar
          </ButtonLink>
        </main>
        <SiteFooter />
      </>
    )
  }

  return (
    <>
      <SiteHeader mode="app" />
      <main className="layout-shell flex min-w-0 max-w-xl flex-col gap-6 py-8 sm:py-10">
        <header className="space-y-3">
          <p className="brand-kicker">
            <span className="brand-kicker-dot" aria-hidden />
            Pedir
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
            Criar meu pedido
          </h1>
          <hr className="brand-rule" />
          <p className="text-sm leading-6 text-text-secondary sm:text-base">
            Você cuidou de alguém. Ao publicar, essa autorização será consumida. Um futuro novo
            pedido exigirá outra oração.
          </p>
        </header>

        <section className="rounded-[var(--radius-lg)] border border-border bg-surface px-5 py-6 shadow-[var(--shadow-soft)] sm:px-7 sm:py-7">
          <CreateRequestForm categories={categories} />
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
