import { Suspense } from "react"
import Link from "next/link"
import { requireUser } from "@/lib/auth/session"
import { PRODUCT_DISPLAY_NAME } from "@/lib/config/product"
import { listActiveCategories, listFeedPrayerRequests, summarizeStory } from "@/modules/prayer-requests"

export const metadata = {
  title: `Encontrar alguém para orar · ${PRODUCT_DISPLAY_NAME}`,
  robots: { index: false, follow: false },
}

type PageProps = {
  searchParams: Promise<{ category?: string }>
}

export default function EncontrarPage(props: PageProps) {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <EncontrarContent {...props} />
    </Suspense>
  )
}

async function EncontrarContent({ searchParams }: PageProps) {
  await requireUser()
  const params = await searchParams
  const categorySlug = params.category?.trim() || undefined

  const [categories, prayerRequests] = await Promise.all([
    listActiveCategories(),
    listFeedPrayerRequests({ categorySlug }),
  ])

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <p className="text-xs tracking-wide text-zinc-500 uppercase">Descoberta · Sprint 1</p>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Encontrar alguém para orar
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
          O feed prioriza quem ainda recebeu poucas orações. Esta é uma versão interna de
          descoberta — o envio de orações virá na próxima etapa.
        </p>
      </header>

      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Categorias">
        <CategoryChip href="/encontrar" active={!categorySlug} label="Todas" />
        {categories.map((category) => (
          <CategoryChip
            key={category.id}
            href={`/encontrar?category=${category.slug}`}
            active={categorySlug === category.slug}
            label={category.name}
          />
        ))}
      </nav>

      {prayerRequests.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-600">
          Nenhum pedido elegível na fila principal neste momento.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {prayerRequests.map((item) => (
            <li key={item.id}>
              <Link
                href={`/encontrar/${item.id}`}
                className="block rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-400"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <span>{item.category.name}</span>
                  <span aria-hidden>·</span>
                  <span>{item.publicLabel}</span>
                  {item.isSyntheticFixture ? (
                    <>
                      <span aria-hidden>·</span>
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-800">
                        fixture de teste
                      </span>
                    </>
                  ) : null}
                </div>
                <h2 className="mt-2 text-lg font-medium text-zinc-900">{item.title}</h2>
                <p className="mt-1 text-sm leading-6 text-zinc-600">{summarizeStory(item.story)}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
                  <span>
                    {item.validPrayerCount === 0
                      ? "Ainda sem orações"
                      : `${item.validPrayerCount} orações válidas`}
                  </span>
                  {item.feed?.priorityHint ? <span>{item.feed.priorityHint}</span> : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm text-zinc-500">
        <Link href="/account" className="underline">
          Minha conta
        </Link>
      </p>
    </main>
  )
}

function CategoryChip({
  href,
  label,
  active,
}: {
  href: string
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "shrink-0 rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white"
          : "shrink-0 rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700"
      }
    >
      {label}
    </Link>
  )
}

function FeedSkeleton() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 text-sm text-zinc-500 sm:px-6">
      Carregando pedidos…
    </main>
  )
}
