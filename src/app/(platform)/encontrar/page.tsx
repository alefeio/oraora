import { Suspense } from "react"
import Link from "next/link"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { Badge } from "@/components/ui/badge"
import { Card, EmptyState } from "@/components/ui/card"
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
    <>
      <SiteHeader mode="app" />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
            Encontrar alguém para orar
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
            O feed prioriza quem ainda recebeu poucas orações. Conheça uma história e ofereça um
            cuidado individual.
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
          <EmptyState
            title="Nenhum pedido na fila principal agora"
            description="Volte em breve ou explore outra categoria."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {prayerRequests.map((item) => (
              <li key={item.id}>
                <Link href={`/encontrar/${item.id}`} className="block rounded-lg focus-visible:outline-offset-4">
                  <Card className="transition hover:border-primary/40">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                      <Badge tone="info">{item.category.name}</Badge>
                      <span>{item.publicLabel}</span>
                      {item.isSyntheticFixture ? <Badge tone="warning">fixture de teste</Badge> : null}
                    </div>
                    <h2 className="mt-2 text-lg font-semibold text-text-primary">{item.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-text-secondary">
                      {summarizeStory(item.story)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-text-muted">
                      <span>
                        {item.validPrayerCount === 0
                          ? "Ainda sem orações válidas"
                          : `${item.validPrayerCount} orações válidas`}
                      </span>
                      {item.feed?.priorityHint ? <span>{item.feed.priorityHint}</span> : null}
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </>
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
          ? "shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-text-on-primary"
          : "shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-primary/40"
      }
    >
      {label}
    </Link>
  )
}

function FeedSkeleton() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 text-sm text-text-muted sm:px-6">
      Carregando pedidos…
    </main>
  )
}
