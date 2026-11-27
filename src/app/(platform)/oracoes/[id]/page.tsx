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
  const isFlagged = outcome === "pending" || outcome === "manual_review"
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
            {isIntercessor
              ? isAccepted
                ? "Sua oração foi entregue!"
                : isFlagged
                  ? "Sua oração foi recebida"
                  : "Sua oração"
              : "Oração recebida"}
          </h1>
          <hr className="brand-rule" />
        </header>

        {isIntercessor && isAccepted ? (
          <section
            role="status"
            aria-live="polite"
            className="space-y-2 rounded-[var(--radius-lg)] border border-border bg-success-soft px-5 py-5"
          >
            <p className="text-sm leading-6 text-success">
              Você dedicou um momento do seu dia para cuidar de alguém. Que esse gesto de amor
              continue alcançando outras vidas.
            </p>
          </section>
        ) : null}

        {isIntercessor && isFlagged ? (
          <section
            role="status"
            aria-live="polite"
            className="space-y-2 rounded-[var(--radius-lg)] border border-border bg-warning-soft px-5 py-5"
          >
            <p className="text-sm leading-6 text-warning">
              Estamos verificando esta interação para manter nossa comunidade segura. Você poderá
              acompanhar o envio na sua conta.
            </p>
          </section>
        ) : null}

        {isIntercessor && isRejected ? (
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

        {!isIntercessor && isAccepted ? (
          <section
            role="status"
            className="rounded-[var(--radius-lg)] border border-border bg-surface-sage-soft px-5 py-4 text-sm leading-6 text-text-secondary"
          >
            Uma pessoa da comunidade orou por você.
          </section>
        ) : null}

        <Card className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={isAccepted ? "success" : isRejected ? "danger" : "warning"}>
              {isFlagged
                ? "em verificação"
                : isAccepted
                  ? "entregue"
                  : isRejected
                    ? "não liberou pedido"
                    : outcome}
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
          {isIntercessor && isAccepted && eligibility.canPublish ? (
            <div className="space-y-3">
              <p className="text-sm leading-6 text-text-secondary">
                Agora também podemos orar por você.
              </p>
              <ButtonLink href="/pedir" size="lg">
                Compartilhar meu pedido
              </ButtonLink>
            </div>
          ) : null}

          {isIntercessor && isAccepted && !eligibility.canPublish ? (
            <p className="text-sm leading-6 text-text-secondary">
              {eligibility.message ||
                "No momento você ainda não tem um direito aberto para criar um pedido. Continue intercedendo no feed."}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/encontrar" variant="secondary" size="lg">
              Continuar orando por pessoas
            </ButtonLink>
            <Link
              href="/account/oracoes"
              className="inline-flex min-h-11 items-center justify-center text-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-offset-4"
            >
              Ver orações enviadas
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
