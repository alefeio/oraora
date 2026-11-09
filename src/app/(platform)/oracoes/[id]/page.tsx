import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
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
    <Suspense fallback={<main className="px-4 py-8 text-sm text-zinc-500">Carregando…</main>}>
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
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Sua oração</h1>

      {outcome === "pending" || outcome === "manual_review" ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Sua oração foi recebida. Estamos verificando a interação antes de liberar seu próximo
          pedido.
        </p>
      ) : null}
      {outcome === "accepted" ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Sua oração foi considerada válida para reciprocidade.
        </p>
      ) : null}
      {outcome === "rejected" ? (
        <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
          Esta oração não liberou o direito de pedir. Você pode orar por outra pessoa com atenção
          individual à história.
        </p>
      ) : null}

      <section className="space-y-2 rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-xs text-zinc-500">Estado: {outcome}</p>
        {dto.scripture ? (
          <p className="text-sm text-zinc-600">Passagem: {dto.scripture.referenceLabel}</p>
        ) : null}
        <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-800">{dto.body}</p>
      </section>

      {eligibility.canPublish ? (
        <div className="space-y-2">
          <p className="text-sm text-zinc-700">{eligibility.message}</p>
          <Link
            href="/pedir"
            className="inline-flex rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Criar meu pedido
          </Link>
        </div>
      ) : (
        <Link href="/encontrar" className="text-sm text-zinc-600 underline">
          Encontrar alguém para orar
        </Link>
      )}
    </main>
  )
}
