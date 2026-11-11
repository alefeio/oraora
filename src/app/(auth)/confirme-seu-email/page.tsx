import { Suspense } from "react"
import { AuthShell, AuthTextLink } from "@/components/auth/auth-shell"
import { ConfirmEmailPanel } from "@/components/auth/confirm-email-panel"
import { AUTH_PATHS } from "@/lib/auth/safe-callback"
import { PRODUCT_DISPLAY_NAME } from "@/lib/config/product"

export default function ConfirmEmailPage() {
  return (
    <AuthShell
      title="Confira seu e-mail"
      subtitle={`Confirme sua conta para entrar no ${PRODUCT_DISPLAY_NAME}`}
      footer={
        <p className="text-center text-sm text-text-secondary">
          Já confirmou? <AuthTextLink href={AUTH_PATHS.login}>Entrar</AuthTextLink>
        </p>
      }
    >
      <Suspense fallback={<p className="text-sm text-text-secondary">Carregando…</p>}>
        <ConfirmEmailPanel />
      </Suspense>
    </AuthShell>
  )
}
