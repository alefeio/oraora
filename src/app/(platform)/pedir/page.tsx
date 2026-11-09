import { Suspense } from "react"
import Link from "next/link"
import { requireUser } from "@/lib/auth/session"
import { listActiveCategories } from "@/modules/prayer-requests"
import { getRequestEligibilitySnapshot } from "@/modules/reciprocity"
import { CreateRequestForm } from "@/components/prayer/create-request-form"
import { PRODUCT_DISPLAY_NAME } from "@/lib/config/product"

export const metadata = {
  title: `Criar pedido · ${PRODUCT_DISPLAY_NAME}`,
  robots: { index: false, follow: false },
}

export default function PedirPage() {
  return (
    <Suspense fallback={<main className="px-4 py-8 text-sm text-zinc-500">Carregando…</main>}>
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
      <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Antes de pedir</h1>
        <p className="text-sm leading-6 text-zinc-700">{eligibility.message}</p>
        <Link
          href="/encontrar"
          className="inline-flex rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Encontrar alguém para orar
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900">Criar meu pedido</h1>
        <p className="text-sm text-zinc-600">
          Você cuidou de alguém. Ao publicar, essa autorização será consumida. Um futuro novo pedido
          exigirá outra oração.
        </p>
      </header>
      <CreateRequestForm categories={categories} />
    </main>
  )
}
