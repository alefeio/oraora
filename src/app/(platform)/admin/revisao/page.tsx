import { Suspense } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { AdminValidationActions } from "@/components/prayer/admin-validation-actions"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { Badge } from "@/components/ui/badge"
import { Card, EmptyState } from "@/components/ui/card"
import { requireUser } from "@/lib/auth/session"
import { isAdminRole } from "@/lib/auth/policy"
import { prisma } from "@/lib/db/prisma"
import { PRODUCT_DISPLAY_NAME } from "@/lib/config/product"

export const metadata = {
  title: `Moderação · ${PRODUCT_DISPLAY_NAME}`,
  robots: { index: false, follow: false },
}

export default function AdminReviewPage() {
  return (
    <Suspense fallback={<main className="px-4 py-8 text-sm text-text-muted">Carregando…</main>}>
      <AdminReviewContent />
    </Suspense>
  )
}

function signalLabels(signals: unknown): string[] {
  if (!signals || typeof signals !== "object") return []
  const record = signals as { classificationSignals?: unknown }
  if (!Array.isArray(record.classificationSignals)) return []
  return record.classificationSignals.filter((s): s is string => typeof s === "string")
}

async function AdminReviewContent() {
  const session = await requireUser()
  if (!isAdminRole(session.user.role)) redirect("/")

  const queue = await prisma.prayer.findMany({
    where: {
      validation: { outcome: { in: ["manual_review", "pending"] } },
    },
    include: { validation: true, request: true },
    orderBy: { createdAt: "asc" },
    take: 50,
  })

  return (
    <>
      <SiteHeader mode="app" />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-primary">Fila de exceções</h1>
          <p className="text-sm text-text-secondary">
            Moderação humana por exceção. Não julgue fé, eloquência ou denominação — proteja a
            comunidade com critérios objetivos.
          </p>
        </header>
        {queue.length === 0 ? (
          <EmptyState
            title="Nenhuma exceção na fila"
            description="Orações regulares são aceitas automaticamente. Aqui aparecem sinalizações e legados pendentes."
          />
        ) : (
          <ul className="space-y-4">
            {queue.map((prayer) => {
              const outcome = prayer.validation?.outcome ?? "pending"
              const signals = signalLabels(prayer.validation?.signals)
              return (
                <li key={prayer.id}>
                  <Card>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                      <Badge tone="warning">
                        {outcome === "manual_review" ? "sinalizada" : "legado pendente"}
                      </Badge>
                      <span>Pedido: {prayer.request.title}</span>
                      <span>{prayer.createdAt.toISOString()}</span>
                      {prayer.validation ? (
                        <span>política v{prayer.validation.policyVersion}</span>
                      ) : null}
                    </div>
                    {signals.length > 0 ? (
                      <p className="mt-2 text-xs text-text-secondary">
                        Motivos objetivos: {signals.join(", ")}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-text-muted">
                        Sem sinais estruturados (possível registro legado).
                      </p>
                    )}
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-text-primary">
                      {prayer.body}
                    </p>
                    <AdminValidationActions prayerId={prayer.id} />
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
        <Link
          href="/encontrar"
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          Voltar ao feed
        </Link>
      </main>
      <SiteFooter />
    </>
  )
}
