import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { Badge } from "@/components/ui/badge"
import { ButtonLink } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
        <Link
          href="/encontrar"
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          Voltar ao feed
        </Link>

        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
            <Badge tone="info">{prayerRequest.category.name}</Badge>
            <span>{prayerRequest.publicLabel}</span>
            <Badge tone="neutral">{prayerRequest.status}</Badge>
            {prayerRequest.isSyntheticFixture ? (
              <Badge tone="warning">fixture de teste</Badge>
            ) : null}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
            {prayerRequest.title}
          </h1>
        </header>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-text-primary">História</h2>
          <p className="whitespace-pre-wrap text-base leading-7 text-text-secondary">
            {prayerRequest.story}
          </p>
        </section>

        <Card>
          <h2 className="text-sm font-semibold text-text-primary">O que apresentar em oração</h2>
          <p className="mt-2 text-base leading-7 text-text-secondary">{prayerRequest.prayerNeed}</p>
        </Card>

        <section className="flex flex-wrap gap-4 text-sm text-text-secondary">
          <span>
            {prayerRequest.validPrayerCount === 0
              ? "Ainda ninguém orou por este pedido"
              : `${prayerRequest.validPrayerCount} orações válidas na comunidade`}
          </span>
          {prayerRequest.feed?.priorityHint ? <span>{prayerRequest.feed.priorityHint}</span> : null}
        </section>

        <div className="space-y-2">
          <ButtonLink href={`/encontrar/${prayerRequest.id}/orar`} size="lg" className="w-full">
            Quero orar por {prayerRequest.publicLabel}
          </ButtonLink>
          <p className="text-center text-xs leading-5 text-text-muted">
            Você será guiado a refletir, escolher uma Palavra (opcional) e escrever uma oração
            individual.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}

function DetailSkeleton() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 text-sm text-text-muted sm:px-6">
      Carregando pedido…
    </main>
  )
}
