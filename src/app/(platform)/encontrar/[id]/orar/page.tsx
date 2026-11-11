import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { PrayerComposeForm } from "@/components/prayer/prayer-compose-form"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { Card } from "@/components/ui/card"
import { requireUser } from "@/lib/auth/session"
import { PRODUCT_DISPLAY_NAME } from "@/lib/config/product"
import { getReadablePrayerRequestById } from "@/modules/prayer-requests"

export const metadata = {
  title: `Orar · ${PRODUCT_DISPLAY_NAME}`,
  robots: { index: false, follow: false },
}

type PageProps = { params: Promise<{ id: string }> }

export default function OrarPage(props: PageProps) {
  return (
    <Suspense
      fallback={<main className="px-4 py-8 text-sm text-text-muted">Preparando…</main>}
    >
      <OrarContent {...props} />
    </Suspense>
  )
}

async function OrarContent({ params }: PageProps) {
  await requireUser()
  const { id } = await params
  const prayerRequest = await getReadablePrayerRequestById(id)
  if (!prayerRequest) notFound()

  return (
    <>
      <SiteHeader mode="app" />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
        <Link
          href={`/encontrar/${prayerRequest.id}`}
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          Voltar ao pedido
        </Link>
        <header className="space-y-2">
          <p className="text-xs text-text-muted">
            {prayerRequest.category.name} · {prayerRequest.publicLabel}
          </p>
          <h1 className="text-2xl font-bold text-primary">
            Orar por {prayerRequest.publicLabel}
          </h1>
          <p className="text-sm leading-6 text-text-secondary">
            Leia com atenção, escolha uma Palavra se desejar, e escreva uma oração individual.
          </p>
        </header>
        <Card>
          <h2 className="text-sm font-semibold text-text-primary">{prayerRequest.title}</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-secondary">
            {prayerRequest.story}
          </p>
          <p className="mt-3 text-sm text-text-secondary">
            <span className="font-medium text-text-primary">Intenção: </span>
            {prayerRequest.prayerNeed}
          </p>
        </Card>
        <PrayerComposeForm
          requestId={prayerRequest.id}
          categorySlug={prayerRequest.category.slug}
          publicLabel={prayerRequest.publicLabel}
        />
      </main>
      <SiteFooter />
    </>
  )
}
