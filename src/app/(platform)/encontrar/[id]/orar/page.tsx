import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { PrayerComposeForm } from "@/components/prayer/prayer-compose-form"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { Badge } from "@/components/ui/badge"
import { ButtonLink } from "@/components/ui/button"
import { requireUser } from "@/lib/auth/session"
import { PRODUCT_DISPLAY_NAME } from "@/lib/config/product"
import { getPrayerSubmissionAvailability } from "@/modules/intercession/prayer-availability"
import { getReadablePrayerRequestById } from "@/modules/prayer-requests"

export const metadata = {
  title: `Orar · ${PRODUCT_DISPLAY_NAME}`,
  robots: { index: false, follow: false },
}

type PageProps = { params: Promise<{ id: string }> }

export default function OrarPage(props: PageProps) {
  return (
    <Suspense
      fallback={<main className="layout-shell py-8 text-sm text-text-muted">Preparando…</main>}
    >
      <OrarContent {...props} />
    </Suspense>
  )
}

async function OrarContent({ params }: PageProps) {
  const session = await requireUser()
  const { id } = await params
  const prayerRequest = await getReadablePrayerRequestById(id, {
    viewerUserId: session.user.id,
  })
  if (!prayerRequest) notFound()

  const availability = getPrayerSubmissionAvailability({
    requestStatus: prayerRequest.status,
    contentVisibility: "authenticated",
    viewerIsAuthor: prayerRequest.viewerIsAuthor === true,
  })

  if (!availability.canSubmit) {
    return (
      <>
        <SiteHeader mode="app" />
        <main className="layout-shell flex min-w-0 max-w-2xl flex-col gap-6 py-8 sm:py-10">
          <header className="space-y-3">
            <p className="brand-kicker">
              <span className="brand-kicker-dot" aria-hidden />
              Orar
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
              {availability.reason === "SELF_PRAYER_FORBIDDEN"
                ? "Seu pedido"
                : "Oração indisponível"}
            </h1>
            <hr className="brand-rule" />
            <p className="text-sm leading-6 text-text-secondary sm:text-base">
              {availability.message}
            </p>
          </header>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={`/encontrar/${prayerRequest.id}`} size="lg">
              Voltar ao pedido
            </ButtonLink>
            <ButtonLink href="/encontrar" variant="secondary" size="lg">
              Ir ao feed
            </ButtonLink>
          </div>
        </main>
        <SiteFooter />
      </>
    )
  }

  return (
    <>
      <SiteHeader mode="app" />
      <main className="layout-shell flex min-w-0 max-w-2xl flex-col gap-8 py-8 sm:gap-10 sm:py-10">
        <Link
          href={`/encontrar/${prayerRequest.id}`}
          className="w-fit text-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-offset-4"
        >
          Voltar ao pedido
        </Link>

        <header className="min-w-0 space-y-3">
          <p className="brand-kicker">
            <span className="brand-kicker-dot" aria-hidden />
            Orar
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
            <Badge tone="info">{prayerRequest.category.name}</Badge>
            <span className="font-medium text-text-secondary">{prayerRequest.publicLabel}</span>
            {prayerRequest.status === "paused" ? (
              <Badge tone="warning">pedido pausado</Badge>
            ) : null}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
            Orar por {prayerRequest.publicLabel}
          </h1>
          <hr className="brand-rule" />
          <p className="text-sm leading-6 text-text-secondary sm:text-base">
            Conheça a história, compreenda a intenção e escreva uma oração individual. A referência
            bíblica é opcional.
          </p>
        </header>

        <section className="space-y-3" aria-labelledby="story-heading">
          <h2
            id="story-heading"
            className="text-sm font-semibold uppercase tracking-[0.08em] text-text-muted"
          >
            1 · História
          </h2>
          <h3 className="text-lg font-semibold tracking-tight text-text-primary">
            {prayerRequest.title}
          </h3>
          <p className="whitespace-pre-wrap text-base leading-7 text-text-secondary">
            {prayerRequest.story}
          </p>
        </section>

        <section
          className="rounded-[var(--radius-lg)] border border-border bg-surface-gold-soft px-5 py-5 sm:px-6 sm:py-6"
          aria-labelledby="intent-heading"
        >
          <h2 id="intent-heading" className="text-sm font-semibold text-primary">
            2 · Intenção do pedido
          </h2>
          <p className="mt-3 text-base leading-7 text-text-secondary">
            {prayerRequest.prayerNeed}
          </p>
        </section>

        <section className="space-y-4" aria-labelledby="compose-heading">
          <div className="space-y-2">
            <h2
              id="compose-heading"
              className="text-sm font-semibold uppercase tracking-[0.08em] text-text-muted"
            >
              3 · Sua oração
            </h2>
            <p className="text-sm leading-6 text-text-secondary">
              Escolha uma Palavra se desejar e escreva com atenção. O envio registra o cuidado
              individual — a reciprocidade depende da validação posterior.
            </p>
          </div>
          <PrayerComposeForm
            requestId={prayerRequest.id}
            categorySlug={prayerRequest.category.slug}
            publicLabel={prayerRequest.publicLabel}
            accountUserId={session.user.id}
          />
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
