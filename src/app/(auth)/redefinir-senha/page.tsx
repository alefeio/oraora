import { Suspense } from "react"
import { AuthShell, AuthTextLink } from "@/components/auth/auth-shell"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { AUTH_PATHS } from "@/lib/auth/safe-callback"

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Redefinir senha"
      subtitle="Escolha uma nova senha para sua conta"
      footer={
        <p className="text-center text-sm text-text-secondary">
          <AuthTextLink href={AUTH_PATHS.login}>Voltar ao login</AuthTextLink>
        </p>
      }
    >
      <Suspense fallback={<p className="text-sm text-text-secondary">Carregando…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  )
}
