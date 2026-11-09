import { SignupForm } from "@/components/auth/signup-form"
import { PRODUCT_DISPLAY_NAME } from "@/lib/config/product"
import Link from "next/link"

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col gap-6 px-6 py-16">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900">Criar conta</h1>
        <p className="text-sm text-zinc-600">
          Cadastro público · {PRODUCT_DISPLAY_NAME} (nome provisório)
        </p>
      </div>
      <SignupForm />
      <p className="text-sm text-zinc-600">
        Já tem conta?{" "}
        <Link href="/login" className="underline">
          Entrar
        </Link>
      </p>
    </main>
  )
}
