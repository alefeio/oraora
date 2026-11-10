import { Suspense } from "react"
import { LogoutButton } from "@/components/auth/logout-button"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { ButtonLink } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { requireUser } from "@/lib/auth/session"
import { PRODUCT_DISPLAY_NAME, PRODUCT_PRINCIPLE } from "@/lib/config/product"

export default function AccountPage() {
  return (
    <Suspense
      fallback={<main className="px-6 py-16 text-sm text-text-muted">Carregando conta…</main>}
    >
      <AccountContent />
    </Suspense>
  )
}

async function AccountContent() {
  const session = await requireUser()

  return (
    <>
      <SiteHeader mode="app" />
      <main className="mx-auto flex min-h-full w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-primary">Minha conta</h1>
          <p className="text-sm text-text-secondary">
            Sessão autenticada no {PRODUCT_DISPLAY_NAME}
          </p>
        </div>
        <Card>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-text-muted">Nome</dt>
              <dd className="font-medium text-text-primary">{session.user.name}</dd>
            </div>
            <div>
              <dt className="text-text-muted">E-mail</dt>
              <dd className="font-medium text-text-primary">{session.user.email}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Papel</dt>
              <dd className="font-medium text-text-primary">{session.user.role ?? "USER"}</dd>
            </div>
            <div>
              <dt className="text-text-muted">E-mail verificado</dt>
              <dd className="font-medium text-text-primary">
                {session.user.emailVerified ? "sim" : "não (modo desenvolvimento)"}
              </dd>
            </div>
          </dl>
        </Card>
        <p className="text-sm leading-6 text-text-secondary">
          Você pode encontrar pedidos, enviar orações e, quando elegível, publicar o seu próprio
          pedido. A solidariedade financeira ainda não está disponível.{" "}
          <span className="font-medium text-primary">{PRODUCT_PRINCIPLE}</span>
        </p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/encontrar">Encontrar alguém para orar</ButtonLink>
          <ButtonLink href="/pedir" variant="secondary">
            Pedir oração
          </ButtonLink>
          <LogoutButton />
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
