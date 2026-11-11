import { BrandLogo } from "@/components/brand/logo"
import { SignupForm } from "@/components/auth/signup-form"
import { AuthTextLink } from "@/components/auth/auth-shell"
import { Card } from "@/components/ui/card"
import { FormError } from "@/components/ui/field"
import { publicSignupEnabled } from "@/lib/auth/email"
import { AUTH_PATHS } from "@/lib/auth/safe-callback"
import { PRODUCT_DISPLAY_NAME, PRODUCT_PRINCIPLE } from "@/lib/config/product"

export default function SignupPage() {
  const open = publicSignupEnabled()

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col gap-6 px-4 py-12 sm:px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <BrandLogo size="md" priority />
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-primary">Criar conta</h1>
          <p className="text-sm text-text-secondary">
            Comece a participar do {PRODUCT_DISPLAY_NAME}
          </p>
        </div>
      </div>
      <Card>
        {open ? (
          <SignupForm />
        ) : (
          <div className="space-y-3">
            <FormError>
              O cadastro público neste ambiente está temporariamente indisponível. O envio de
              e-mail de verificação ainda não está configurado de forma segura.
            </FormError>
            <p className="text-sm text-text-secondary">
              Quando o provedor de e-mail do projeto estiver ativo, o cadastro será reaberto sem
              enfraquecer a verificação de e-mail.
            </p>
          </div>
        )}
      </Card>
      <p className="text-center text-sm font-medium text-primary">{PRODUCT_PRINCIPLE}</p>
      <p className="text-center text-sm text-text-secondary">
        Já tem conta? <AuthTextLink href={AUTH_PATHS.login}>Entrar</AuthTextLink>
      </p>
    </main>
  )
}
