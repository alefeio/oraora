import { Suspense } from "react"
import Link from "next/link"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { Badge } from "@/components/ui/badge"
import { Card, EmptyState } from "@/components/ui/card"
import { requireUser } from "@/lib/auth/session"
import { PRODUCT_DISPLAY_NAME } from "@/lib/config/product"
import { listFeedWithFilterCategories, summarizeStory } from "@/modules/prayer-requests"

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
  const session = await requireUser()
  const params = await searchParams
  const requestedCategory = params.category?.trim() || undefined

  const { requests: allRequests, filterCategories } = await listFeedWithFilterCategories({
    viewerUserId: session.user.id,
  })

  // ?category= sem pedidos na fila principal → feed geral, sem erro.
  const categorySlug =
    requestedCategory && filterCategories.some((category) => category.slug === requestedCategory)
      ? requestedCategory
      : undefined

  const prayerRequests = categorySlug
    ? allRequests.filter((item) => item.category.slug === categorySlug)
    : allRequests

  const showCategoryRail = allRequests.length > 0 && filterCategories.length > 0

  return (
    <>
      <SiteHeader mode="app" />
      <main className="layout-shell flex min-w-0 max-w-3xl flex-col gap-7 py-8 sm:gap-8 sm:py-10">
        <header className="min-w-0 space-y-3">
          <p className="brand-kicker">
            <span className="brand-kicker-dot" aria-hidden />
            Encontrar
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
            Encontrar alguém para orar
          </h1>
          <hr className="brand-rule" />
          <p className="max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
            O feed prioriza quem ainda recebeu poucas orações. Conheça uma história e ofereça um
            cuidado individual.
          </p>
        </header>

        {showCategoryRail ? (
          <nav
            className="category-rail -mx-1 min-w-0 max-w-full overflow-x-auto px-1 pb-1"
            aria-label="Categorias com pedidos na fila"
          >
            <div className="flex w-max max-w-none flex-nowrap gap-2 md:w-full md:max-w-full md:flex-wrap">
              <CategoryChip href="/encontrar" active={!categorySlug} label="Todas" />
              {filterCategories.map((category) => (
                <CategoryChip
                  key={category.id}
                  href={`/encontrar?category=${category.slug}`}
                  active={categorySlug === category.slug}
                  label={category.name}
                />
              ))}
            </div>
          </nav>
        ) : null}

        {prayerRequests.length === 0 ? (
          <EmptyState
            title="Nenhum pedido na fila principal agora"
            description="Volte em breve. Quando houver pedidos, os filtros de categoria aparecerão aqui."
            className="border-0 bg-surface-sage-soft"
          />
        ) : (
          <ul className="flex min-w-0 flex-col gap-4">
            {prayerRequests.map((item) => (
              <li key={item.id} className="min-w-0">
                <Link
                  href={`/encontrar/${item.id}`}
                  className="block rounded-[var(--radius-lg)] focus-visible:outline-offset-4"
                >
                  <Card className="p-5 transition hover:border-primary/35 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                      <Badge tone="info">{item.category.name}</Badge>
                      <span className="font-medium text-text-secondary">{item.publicLabel}</span>
                      {item.viewerIsAuthor ? (
                        <Badge tone="neutral">Seu pedido</Badge>
                      ) : null}
                      {item.isSyntheticFixture ? (
                        <Badge tone="warning">fixture de teste</Badge>
                      ) : null}
                    </div>
                    <h2 className="mt-3 text-lg font-semibold tracking-tight text-text-primary sm:text-xl">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-text-secondary">
                      {summarizeStory(item.story)}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
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
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-text-on-primary focus-visible:outline-offset-2"
          : "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-border-control bg-surface px-4 text-sm font-medium text-text-secondary hover:border-primary/40 hover:text-primary focus-visible:outline-offset-2"
      }
    >
      {label}
    </Link>
  )
}

function FeedSkeleton() {
  return (
    <main className="layout-shell max-w-3xl py-8 text-sm text-text-muted sm:py-10">
      Carregando pedidos…
    </main>
  )
}
