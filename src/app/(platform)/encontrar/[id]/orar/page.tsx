import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { requireUser } from "@/lib/auth/session"
import { PRODUCT_DISPLAY_NAME } from "@/lib/config/product"
import { getReadablePrayerRequestById } from "@/modules/prayer-requests"
import { PrayerComposeForm } from "@/components/prayer/prayer-compose-form"

export const metadata = {
  title: `Orar · ${PRODUCT_DISPLAY_NAME}`,
  robots: { index: false, follow: false },
}

type PageProps = { params: Promise<{ id: string }> }

export default function OrarPage(props: PageProps) {
  return (
    <Suspense fallback={<main className="px-4 py-8 text-sm text-zinc-500">Preparando…</main>}>
      <OrarContent {...props} />
    </Suspense>
  )
}

async function OrarContent({ params }: PageProps) {
  const session = await requireUser()
  const { id } = await params
  const prayerRequest = await getReadablePrayerRequestById(id)
  if (!prayerRequest) notFound()

  // Bloqueio de auto-oração também na UI (servidor reforça)
  // authorId não está no DTO; a API rejeitará se for o próprio pedido.

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
      <Link href={`/encontrar/${prayerRequest.id}`} className="text-sm text-zinc-600 underline">
        Voltar ao pedido
      </Link>
      <header className="space-y-2">
        <p className="text-xs text-zinc-500">
          {prayerRequest.category.name} · {prayerRequest.publicLabel}
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900">Orar por {prayerRequest.publicLabel}</h1>
        <p className="text-sm leading-6 text-zinc-600">
          Leia com atenção, escolha uma Palavra se desejar, e escreva uma oração individual.
        </p>
      </header>
      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-medium text-zinc-900">{prayerRequest.title}</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{prayerRequest.story}</p>
        <p className="mt-3 text-sm text-zinc-600">
          <span className="font-medium text-zinc-900">Intenção: </span>
          {prayerRequest.prayerNeed}
        </p>
      </section>
      <PrayerComposeForm
        requestId={prayerRequest.id}
        categorySlug={prayerRequest.category.slug}
        publicLabel={prayerRequest.publicLabel}
      />
      <p className="text-xs text-zinc-500">Sessão: {session.user.email}</p>
    </main>
  )
}
