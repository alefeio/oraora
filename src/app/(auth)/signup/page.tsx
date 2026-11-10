import Link from "next/link"
import { BrandLogo } from "@/components/brand/logo"
import { SignupForm } from "@/components/auth/signup-form"
import { Card } from "@/components/ui/card"
import { PRODUCT_DISPLAY_NAME, PRODUCT_PRINCIPLE } from "@/lib/config/product"

export default function SignupPage() {
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
        <SignupForm />
      </Card>
      <p className="text-center text-sm font-medium text-primary">{PRODUCT_PRINCIPLE}</p>
      <p className="text-center text-sm text-text-secondary">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-2 hover:underline">
          Entrar
        </Link>
      </p>
    </main>
  )
}
