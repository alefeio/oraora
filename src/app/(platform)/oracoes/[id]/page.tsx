import { Suspense } from "react"
import { notFound } from "next/navigation"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { ButtonLink } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { requireUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { isAdminRole } from "@/lib/auth/policy"
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
    <Suspense fallback={<main className="px-4 py-8 text-sm text-text-muted">Carregando…</main>}>
      <PrayerStatusContent {...props} />
    </Suspense>
  )
}

async function PrayerStatusContent({ params }: PageProps) {
  const session = await requireUser()
  const { id } = await params
  const prayer = await prisma.prayer.findUnique({
    where: { id },
    include: { validation: true, scripturePassage: true },
  })
  if (!prayer) notFound()

  const allowed =
    prayer.intercessorId === session.user.id ||
    prayer.beneficiaryId === session.user.id ||
    isAdminRole(session.user.role)
  if (!allowed) notFound()

  if (
    prayer.beneficiaryId === session.user.id &&
    prayer.intercessorId !== session.user.id &&
    !isAdminRole(session.user.role) &&
    prayer.validation?.outcome !== "accepted"
  ) {
    notFound()
  }

  const dto = toPrayerDto(prayer)
  const eligibility = await getRequestEligibilitySnapshot(session.user.id)
  const outcome = dto.validation?.outcome ?? "pending"

  return (
    <>
      <SiteHeader mode="app" />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-primary">Sua oração</h1>

        {outcome === "pending" || outcome === "manual_review" ? (
          <p
            role="status"
            className="rounded-lg border border-border bg-warning-soft px-4 py-3 text-sm text-warning"
          >
            Sua oração foi recebida. Estamos verificando a interação antes de liberar seu próximo
            pedido.
          </p>
        ) : null}
        {outcome === "accepted" ? (
          <p
            role="status"
            className="rounded-lg border border-border bg-success-soft px-4 py-3 text-sm text-success"
          >
            Sua oração foi considerada válida para reciprocidade.
          </p>
        ) : null}
        {outcome === "rejected" ? (
          <p
            role="status"
            className="rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm text-text-secondary"
          >
            Esta oração não liberou o direito de pedir. Você pode orar por outra pessoa com atenção
            individual à história.
          </p>
        ) : null}

        <Card>
          <div className="mb-2 flex items-center gap-2">
            <Badge
              tone={
                outcome === "accepted" ? "success" : outcome === "rejected" ? "danger" : "warning"
              }
            >
              {outcome}
            </Badge>
            {dto.scripture ? (
              <span className="text-sm text-text-secondary">
                Passagem: {dto.scripture.referenceLabel}
              </span>
            ) : null}
          </div>
          <p className="whitespace-pre-wrap text-sm leading-6 text-text-primary">{dto.body}</p>
        </Card>

        {eligibility.canPublish ? (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">{eligibility.message}</p>
            <ButtonLink href="/pedir">Criar meu pedido</ButtonLink>
          </div>
        ) : (
          <ButtonLink href="/encontrar" variant="secondary">
            Encontrar alguém para orar
          </ButtonLink>
        )}
      </main>
      <SiteFooter />
    </>
  )
}
