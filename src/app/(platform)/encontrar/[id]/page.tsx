import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
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
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
      <Link href="/encontrar" className="text-sm text-zinc-600 underline">
        Voltar ao feed
      </Link>

      <header className="space-y-3">
        <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
          <span>{prayerRequest.category.name}</span>
          <span aria-hidden>·</span>
          <span>{prayerRequest.publicLabel}</span>
          <span aria-hidden>·</span>
          <span>status: {prayerRequest.status}</span>
          {prayerRequest.isSyntheticFixture ? (
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-800">
              fixture de teste
            </span>
          ) : null}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          {prayerRequest.title}
        </h1>
      </header>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-zinc-900">História</h2>
        <p className="whitespace-pre-wrap text-base leading-7 text-zinc-700">{prayerRequest.story}</p>
      </section>

      <section className="space-y-2 rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-medium text-zinc-900">O que apresentar em oração</h2>
        <p className="text-base leading-7 text-zinc-700">{prayerRequest.prayerNeed}</p>
      </section>

      <section className="flex flex-wrap gap-4 text-sm text-zinc-600">
        <span>
          {prayerRequest.validPrayerCount === 0
            ? "Ainda ninguém orou por este pedido"
            : `${prayerRequest.validPrayerCount} orações válidas na comunidade`}
        </span>
        {prayerRequest.feed?.priorityHint ? <span>{prayerRequest.feed.priorityHint}</span> : null}
      </section>

      <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <button
          type="button"
          disabled
          className="w-full rounded-md bg-zinc-300 px-4 py-3 text-sm font-medium text-zinc-600"
        >
          Quero orar por {prayerRequest.publicLabel}
        </button>
        <p className="text-center text-xs leading-5 text-zinc-500">
          O fluxo de intercessão ainda não foi disponibilizado. Em breve você poderá ler, escolher
          uma Palavra e escrever uma oração real.
        </p>
      </div>
    </main>
  )
}

function DetailSkeleton() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 text-sm text-zinc-500 sm:px-6">
      Carregando pedido…
    </main>
  )
}
