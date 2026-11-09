import { Suspense } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { requireUser } from "@/lib/auth/session"
import { isAdminRole } from "@/lib/auth/policy"
import { prisma } from "@/lib/db/prisma"
import { AdminValidationActions } from "@/components/prayer/admin-validation-actions"
import { PRODUCT_DISPLAY_NAME } from "@/lib/config/product"

export const metadata = {
  title: `Revisão · ${PRODUCT_DISPLAY_NAME}`,
  robots: { index: false, follow: false },
}

export default function AdminReviewPage() {
  return (
    <Suspense fallback={<main className="px-4 py-8 text-sm text-zinc-500">Carregando…</main>}>
      <AdminReviewContent />
    </Suspense>
  )
}

async function AdminReviewContent() {
  const session = await requireUser()
  if (!isAdminRole(session.user.role)) redirect("/")

  const pending = await prisma.prayer.findMany({
    where: { validation: { outcome: "pending" } },
    include: { validation: true, request: true },
    orderBy: { createdAt: "asc" },
    take: 50,
  })

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Revisão de orações</h1>
      <p className="text-sm text-zinc-600">
        Ambiente controlado: aprove ou rejeite com auditoria. Não julgue eloquência religiosa.
      </p>
      {pending.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhuma oração pendente.</p>
      ) : (
        <ul className="space-y-4">
          {pending.map((prayer) => (
            <li key={prayer.id} className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-xs text-zinc-500">
                Pedido: {prayer.request.title} · {prayer.createdAt.toISOString()}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-800">{prayer.body}</p>
              <AdminValidationActions prayerId={prayer.id} />
            </li>
          ))}
        </ul>
      )}
      <Link href="/encontrar" className="text-sm underline">
        Voltar
      </Link>
    </main>
  )
}
