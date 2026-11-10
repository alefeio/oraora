import Link from "next/link"
import { BrandLogo } from "@/components/brand/logo"
import { LoginForm } from "@/components/auth/login-form"
import { Card } from "@/components/ui/card"
import { PRODUCT_DISPLAY_NAME } from "@/lib/config/product"

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col gap-6 px-4 py-12 sm:px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <BrandLogo size="md" priority />
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-primary">Entrar</h1>
          <p className="text-sm text-text-secondary">
            Acesse sua conta no {PRODUCT_DISPLAY_NAME}
          </p>
        </div>
      </div>
      <Card>
        <LoginForm />
      </Card>
      <p className="text-center text-sm text-text-secondary">
        Não tem conta?{" "}
        <Link href="/signup" className="font-medium text-primary underline-offset-2 hover:underline">
          Cadastre-se
        </Link>
      </p>
      <p className="text-center text-xs text-text-muted">Ambiente de desenvolvimento</p>
    </main>
  )
}
