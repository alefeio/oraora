import { AuthShell, AuthTextLink } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"
import { AUTH_PATHS } from "@/lib/auth/safe-callback"
import { PRODUCT_DISPLAY_NAME } from "@/lib/config/product"

export default function LoginPage() {
  return (
    <AuthShell
      title="Entrar"
      subtitle={`Acesse sua conta no ${PRODUCT_DISPLAY_NAME}`}
      footer={
        <p className="text-center text-sm text-text-secondary">
          Não tem conta? <AuthTextLink href={AUTH_PATHS.signup}>Cadastre-se</AuthTextLink>
        </p>
      }
    >
      <LoginForm />
    </AuthShell>
  )
}
