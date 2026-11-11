import { AuthShell, AuthTextLink } from "@/components/auth/auth-shell"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { AUTH_PATHS } from "@/lib/auth/safe-callback"
import { PRODUCT_DISPLAY_NAME } from "@/lib/config/product"

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Esqueci minha senha"
      subtitle={`Recupere o acesso à sua conta no ${PRODUCT_DISPLAY_NAME}`}
      footer={
        <p className="text-center text-sm text-text-secondary">
          Lembrou a senha? <AuthTextLink href={AUTH_PATHS.login}>Voltar ao login</AuthTextLink>
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
