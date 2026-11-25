import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { ButtonLink } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { requireUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { getPrayerReadAccess } from "@/modules/intercession/authorization"
import { toPrayerDto } from "@/modules/intercession"
import { getRequestEligibilitySnapshot } from "@/modules/reciprocity"
import { PRODUCT_DISPLAY_NAME } from "@/lib/config/product"

export const metadata = {
  title: `Oração enviada · ${PRODUCT_DISPLAY_NAME}`,
  robots: { index: false, follow: false },
}

type PageProps = { params: Promise<{ id: string }> }

export default function PrayerStatusPage(props: PageProps) {
  return (
    <Suspense
      fallback={<main className="layout-shell py-8 text-sm text-text-muted">Carregando…</main>}
    >
      <PrayerStatusContent {...props} />
    </Suspense>
  )
}

async function PrayerStatusContent({ params }: PageProps) {
  const session = await requireUser()
  const { id } = await params

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, banned: true },
  })
  if (!actor || actor.banned) notFound()

  const prayer = await prisma.prayer.findUnique({
    where: { id },
    include: { validation: true, scripturePassage: true },
  })
  if (!prayer) notFound()

  const access = getPrayerReadAccess(actor, prayer)
  if (access !== "allowed") notFound()

  const dto = toPrayerDto(prayer)
  const eligibility = await getRequestEligibilitySnapshot(session.user.id)
  const outcome = dto.validation?.outcome ?? "pending"
  const isPending = outcome === "pending" || outcome === "manual_review"
  const isAccepted = outcome === "accepted"
  const isRejected = outcome === "rejected"
  const isIntercessor = prayer.intercessorId === actor.id

  return (
    <>
      <SiteHeader mode="app" />
      <main className="layout-shell flex min-w-0 max-w-2xl flex-col gap-7 py-8 sm:gap-8 sm:py-10">
        <header className="min-w-0 space-y-3">
          <p className="brand-kicker">
            <span className="brand-kicker-dot" aria-hidden />
            Oração
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
            {isIntercessor ? "Sua oração" : "Oração recebida"}
          </h1>
          <hr className="brand-rule" />
        </header>

        {isIntercessor ? (
          <p
            role="status"
            className="rounded-[var(--radius-lg)] border border-border bg-surface-sage-soft px-5 py-4 text-sm leading-6 text-text-secondary"
          >
            Sua oração foi recebida. O recebimento confirma o envio; a liberação para pedir uma
            oração depende da validação.
          </p>
        ) : null}

        {isPending ? (
          <section
            role="status"
            aria-live="polite"
            className="space-y-2 rounded-[var(--radius-lg)] border border-border bg-warning-soft px-5 py-5"
          >
            <h2 className="text-sm font-semibold text-warning">Em análise</h2>
            <p className="text-sm leading-6 text-warning">
              Sua oração foi recebida e está aguardando validação.
            </p>
            <p className="text-sm leading-6 text-text-secondary">
              A reciprocidade — o direito de pedir uma oração — depende dessa validação. Enquanto
              isso, você pode continuar cuidando de outras pessoas no feed.
            </p>
          </section>
        ) : null}

        {isAccepted ? (
          <section
            role="status"
            aria-live="polite"
            className="space-y-2 rounded-[var(--radius-lg)] border border-border bg-success-soft px-5 py-5"
          >
            <h2 className="text-sm font-semibold text-success">Oração aceita</h2>
            <p className="text-sm leading-6 text-success">
              Obrigado pelo cuidado individual. Sua oração foi considerada válida para a
              reciprocidade da comunidade.
            </p>
          </section>
        ) : null}

        {isRejected ? (
          <section
            role="status"
            aria-live="polite"
            className="space-y-2 rounded-[var(--radius-lg)] border border-border bg-surface-muted px-5 py-5"
          >
            <h2 className="text-sm font-semibold text-text-primary">Oração registrada</h2>
            <p className="text-sm leading-6 text-text-secondary">
              Esta oração não liberou o direito de pedir agora. Você continua bem-vindo a orar por
              outras pessoas com atenção à história de cada uma.
            </p>
          </section>
        ) : null}

        <Card className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              tone={
                isAccepted ? "success" : isRejected ? "danger" : "warning"
              }
            >
              {isPending ? "aguardando validação" : isAccepted ? "aceita" : isRejected ? "não liberou pedido" : outcome}
            </Badge>
            {dto.scripture ? (
              <span className="text-sm text-text-secondary">
                Passagem: {dto.scripture.referenceLabel}
              </span>
            ) : null}
          </div>
          <p className="whitespace-pre-wrap text-base leading-7 text-text-primary">{dto.body}</p>
          {dto.scripture?.textBody ? (
            <p className="border-t border-border pt-4 text-sm leading-6 text-text-secondary">
              {dto.scripture.textBody}
            </p>
          ) : dto.scripture ? (
            <p className="border-t border-border pt-4 text-xs leading-5 text-text-muted">
              Texto bíblico não exibido: licença ainda não autorizada para o corpo completo.
            </p>
          ) : null}
        </Card>

        <section className="space-y-4">
          {isAccepted && eligibility.canPublish ? (
            <div className="space-y-3">
              <p className="text-sm leading-6 text-text-secondary">{eligibility.message}</p>
              <ButtonLink href="/pedir" size="lg">
                Criar meu pedido
              </ButtonLink>
            </div>
          ) : null}

          {isAccepted && !eligibility.canPublish ? (
            <p className="text-sm leading-6 text-text-secondary">
              {eligibility.message ||
                "No momento você ainda não tem um direito aberto para criar um pedido. Continue intercedendo no feed."}
            </p>
          ) : null}

          {isPending ? (
            <p className="text-sm leading-6 text-text-muted">
              O botão para criar pedido aparece somente após a validação e quando houver elegibilidade
              aberta.
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/encontrar" variant="secondary" size="lg">
              Encontrar alguém para orar
            </ButtonLink>
            <Link
              href="/account"
              className="inline-flex min-h-11 items-center justify-center text-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-offset-4"
            >
              Ir para minha conta
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
