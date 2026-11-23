import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { Badge } from "@/components/ui/badge"
import { ButtonLink } from "@/components/ui/button"
import { requireUser } from "@/lib/auth/session"
import { PRODUCT_DISPLAY_NAME } from "@/lib/config/product"
import { getReadablePrayerRequestById } from "@/modules/prayer-requests"

export const metadata = {
  title: `Pedido · ${PRODUCT_DISPLAY_NAME}`,
  robots: { index: false, follow: false },
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default function PrayerRequestDetailPage(props: PageProps) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <PrayerRequestDetailContent {...props} />
    </Suspense>
  )
}

async function PrayerRequestDetailContent({ params }: PageProps) {
  await requireUser()
  const { id } = await params
  const prayerRequest = await getReadablePrayerRequestById(id)
  if (!prayerRequest) notFound()

  return (
    <>
      <SiteHeader mode="app" />
      <main className="layout-shell flex min-w-0 max-w-5xl flex-col gap-6 py-8 sm:gap-8 sm:py-10">
        <Link
          href="/encontrar"
          className="w-fit text-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-offset-4"
        >
          Voltar ao feed
        </Link>

        <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.85fr)] lg:items-start lg:gap-10">
          <article className="min-w-0 space-y-6">
            <header className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                <Badge tone="info">{prayerRequest.category.name}</Badge>
                <span className="font-medium text-text-secondary">{prayerRequest.publicLabel}</span>
                <Badge tone="neutral">{prayerRequest.status}</Badge>
                {prayerRequest.isSyntheticFixture ? (
                  <Badge tone="warning">fixture de teste</Badge>
                ) : null}
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
                {prayerRequest.title}
              </h1>
              <hr className="brand-rule" />
            </header>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-text-muted">
                História
              </h2>
              <p className="whitespace-pre-wrap text-base leading-7 text-text-secondary sm:text-[1.05rem] sm:leading-8">
                {prayerRequest.story}
              </p>
            </section>

            <section className="flex flex-wrap gap-4 text-sm text-text-secondary lg:hidden">
              <span>
                {prayerRequest.validPrayerCount === 0
                  ? "Ainda ninguém orou por este pedido"
                  : `${prayerRequest.validPrayerCount} orações válidas na comunidade`}
              </span>
              {prayerRequest.feed?.priorityHint ? (
                <span>{prayerRequest.feed.priorityHint}</span>
              ) : null}
            </section>
          </article>

          <aside className="min-w-0 space-y-4 lg:sticky lg:top-[calc(var(--header-h)+1rem)]">
            <section className="rounded-[var(--radius-lg)] border border-border bg-surface-gold-soft px-5 py-5 shadow-[var(--shadow-soft)] sm:px-6 sm:py-6">
              <h2 className="text-sm font-semibold text-primary">O que apresentar em oração</h2>
              <p className="mt-3 text-base leading-7 text-text-secondary">
                {prayerRequest.prayerNeed}
              </p>
            </section>

            <section className="hidden flex-wrap gap-4 text-sm text-text-secondary lg:flex">
              <span>
                {prayerRequest.validPrayerCount === 0
                  ? "Ainda ninguém orou por este pedido"
                  : `${prayerRequest.validPrayerCount} orações válidas na comunidade`}
              </span>
              {prayerRequest.feed?.priorityHint ? (
                <span>{prayerRequest.feed.priorityHint}</span>
              ) : null}
            </section>

            <div className="space-y-2">
              <ButtonLink
                href={`/encontrar/${prayerRequest.id}/orar`}
                size="lg"
                className="w-full"
              >
                Quero orar por {prayerRequest.publicLabel}
              </ButtonLink>
              <p className="text-center text-xs leading-5 text-text-muted">
                Você será guiado a refletir, escolher uma Palavra (opcional) e escrever uma oração
                individual.
              </p>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}

function DetailSkeleton() {
  return (
    <main className="layout-shell max-w-5xl py-8 text-sm text-text-muted sm:py-10">
      Carregando pedido…
    </main>
  )
}
