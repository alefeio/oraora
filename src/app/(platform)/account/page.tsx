import { Suspense } from "react"
import { LogoutButton } from "@/components/auth/logout-button"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { ButtonLink } from "@/components/ui/button"
import { requireUser } from "@/lib/auth/session"
import { PRODUCT_DISPLAY_NAME, PRODUCT_PRINCIPLE } from "@/lib/config/product"

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <main className="layout-shell py-16 text-sm text-text-muted">Carregando conta…</main>
      }
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
      <main className="layout-shell flex min-h-full min-w-0 max-w-4xl flex-col gap-8 py-10 sm:py-12">
        <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(14rem,0.8fr)] lg:items-start lg:gap-10">
          <section className="min-w-0 space-y-5">
            <header className="space-y-3">
              <p className="brand-kicker">
                <span className="brand-kicker-dot" aria-hidden />
                Conta
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                {session.user.name}
              </h1>
              <p className="text-sm text-text-secondary sm:text-base">{session.user.email}</p>
              <hr className="brand-rule" />
            </header>

            <dl className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-text-muted">Papel</dt>
                <dd className="mt-0.5 font-medium text-text-primary">
                  {session.user.role ?? "USER"}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">E-mail verificado</dt>
                <dd className="mt-0.5 font-medium text-text-primary">
                  {session.user.emailVerified ? "sim" : "não (modo desenvolvimento)"}
                </dd>
              </div>
            </dl>

            <p className="max-w-xl text-sm leading-6 text-text-secondary">
              Você pode encontrar pedidos, enviar orações e, quando elegível, publicar o seu próprio
              pedido. A solidariedade financeira ainda não está disponível. Sessão autenticada no{" "}
              {PRODUCT_DISPLAY_NAME}.{" "}
              <span className="font-medium text-primary">{PRODUCT_PRINCIPLE}</span>
            </p>
          </section>

          <aside className="min-w-0 rounded-[var(--radius-lg)] border border-border bg-surface px-5 py-5 shadow-[var(--shadow-soft)] sm:px-6 sm:py-6">
            <h2 className="text-sm font-semibold text-text-primary">Ações</h2>
            <div className="mt-4 flex flex-col gap-3">
              <ButtonLink href="/encontrar" className="w-full">
                Encontrar alguém para orar
              </ButtonLink>
              <ButtonLink href="/account/oracoes" variant="secondary" className="w-full">
                Orações enviadas
              </ButtonLink>
              <ButtonLink href="/pedir" variant="secondary" className="w-full">
                Pedir oração
              </ButtonLink>
              <LogoutButton />
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
