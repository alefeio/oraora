import { Suspense } from "react"
import Link from "next/link"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { Badge } from "@/components/ui/badge"
import { ButtonLink } from "@/components/ui/button"
import { requireUser } from "@/lib/auth/session"
import { PRODUCT_DISPLAY_NAME } from "@/lib/config/product"
import { listSentPrayersForIntercessor } from "@/modules/intercession"

export const metadata = {
  title: `Orações enviadas · ${PRODUCT_DISPLAY_NAME}`,
  robots: { index: false, follow: false },
}

export default function SentPrayersPage() {
  return (
    <Suspense
      fallback={<main className="layout-shell py-10 text-sm text-text-muted">Carregando…</main>}
    >
      <SentPrayersContent />
    </Suspense>
  )
}

function outcomeLabel(outcome: string | null) {
  switch (outcome) {
    case "accepted":
      return { text: "aceita", tone: "success" as const }
    case "rejected":
      return { text: "não liberou pedido", tone: "danger" as const }
    case "manual_review":
    case "pending":
      return { text: "em verificação", tone: "warning" as const }
    default:
      return { text: "registrada", tone: "warning" as const }
  }
}

async function SentPrayersContent() {
  const session = await requireUser()
  const prayers = await listSentPrayersForIntercessor({
    intercessorId: session.user.id,
  })

  return (
    <>
      <SiteHeader mode="app" />
      <main className="layout-shell flex min-w-0 max-w-3xl flex-col gap-8 py-10 sm:py-12">
        <header className="space-y-3">
          <p className="brand-kicker">
            <span className="brand-kicker-dot" aria-hidden />
            Conta
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Orações enviadas
          </h1>
          <hr className="brand-rule" />
          <p className="max-w-xl text-sm leading-6 text-text-secondary sm:text-base">
            Acompanhe as orações que você já registrou. Se um envio ficou inconclusivo no navegador,
            a oração pode aparecer aqui quando tiver sido gravada.
          </p>
        </header>

        {prayers.length === 0 ? (
          <section className="space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface px-5 py-6">
            <p className="text-sm leading-6 text-text-secondary">
              Você ainda não tem orações enviadas nesta conta.
            </p>
            <ButtonLink href="/encontrar">Encontrar alguém para orar</ButtonLink>
          </section>
        ) : (
          <ul className="space-y-3">
            {prayers.map((prayer) => {
              const badge = outcomeLabel(prayer.validationOutcome)
              const created = new Date(prayer.createdAt)
              return (
                <li key={prayer.id}>
                  <Link
                    href={`/oracoes/${prayer.id}`}
                    className="block rounded-[var(--radius-lg)] border border-border bg-surface px-5 py-4 transition hover:border-primary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={badge.tone}>{badge.text}</Badge>
                      {prayer.hasScripture ? (
                        <span className="text-xs text-text-muted">com passagem</span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-base font-medium text-text-primary">
                      Por {prayer.requestPublicLabel}
                    </p>
                    <p className="mt-1 text-sm text-text-secondary line-clamp-2">
                      {prayer.requestTitle}
                    </p>
                    <p className="mt-2 text-xs text-text-muted">
                      Enviada em{" "}
                      {created.toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/account" variant="secondary">
            Voltar à conta
          </ButtonLink>
          <ButtonLink href="/encontrar" variant="ghost">
            Ir ao feed
          </ButtonLink>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
