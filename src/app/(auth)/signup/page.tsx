import { AuthShell, AuthTextLink } from "@/components/auth/auth-shell"
import { SignupForm } from "@/components/auth/signup-form"
import { FormError } from "@/components/ui/field"
import { publicSignupEnabled } from "@/lib/auth/email"
import { AUTH_PATHS } from "@/lib/auth/safe-callback"
import { PRODUCT_DISPLAY_NAME, PRODUCT_PRINCIPLE } from "@/lib/config/product"

export default function SignupPage() {
  const open = publicSignupEnabled()

  return (
    <AuthShell
      title="Criar conta"
      subtitle={`Comece a participar do ${PRODUCT_DISPLAY_NAME}`}
      footer={
        <div className="space-y-2 text-sm">
          <p className="font-medium text-primary">{PRODUCT_PRINCIPLE}</p>
          <p className="text-text-secondary">
            Já tem conta? <AuthTextLink href={AUTH_PATHS.login}>Entrar</AuthTextLink>
          </p>
        </div>
      }
    >
      {open ? (
        <SignupForm />
      ) : (
        <div className="space-y-3">
          <FormError>
            O cadastro público neste ambiente está temporariamente indisponível. O envio de e-mail
            de verificação ainda não está configurado de forma segura.
          </FormError>
          <p className="text-sm text-text-secondary">
            Quando o provedor de e-mail do projeto estiver ativo, o cadastro será reaberto sem
            enfraquecer a verificação de e-mail.
          </p>
        </div>
      )}
    </AuthShell>
  )
}
