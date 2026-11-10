import { Suspense } from "react"
import { CreateRequestForm } from "@/components/prayer/create-request-form"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { ButtonLink } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
    <Suspense fallback={<main className="px-4 py-8 text-sm text-text-muted">Carregando…</main>}>
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
        <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-10 sm:px-6">
          <h1 className="text-2xl font-bold text-primary">Antes de pedir</h1>
          <p className="text-sm leading-6 text-text-secondary">{eligibility.message}</p>
          <p className="text-sm font-medium text-primary">{PRODUCT_PRINCIPLE}</p>
          <ButtonLink href="/encontrar">Encontrar alguém para orar</ButtonLink>
        </main>
        <SiteFooter />
      </>
    )
  }

  return (
    <>
      <SiteHeader mode="app" />
      <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-8 sm:px-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-primary">Criar meu pedido</h1>
          <p className="text-sm text-text-secondary">
            Você cuidou de alguém. Ao publicar, essa autorização será consumida. Um futuro novo
            pedido exigirá outra oração.
          </p>
        </header>
        <Card>
          <CreateRequestForm categories={categories} />
        </Card>
      </main>
      <SiteFooter />
    </>
  )
}
