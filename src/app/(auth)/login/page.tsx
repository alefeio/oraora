import { LoginForm } from "@/components/auth/login-form"
import { PRODUCT_DISPLAY_NAME } from "@/lib/config/product"
import Link from "next/link"

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col gap-6 px-6 py-16">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900">Entrar</h1>
        <p className="text-sm text-zinc-600">{PRODUCT_DISPLAY_NAME} · ambiente de desenvolvimento</p>
      </div>
      <LoginForm />
      <p className="text-sm text-zinc-600">
        Não tem conta?{" "}
        <Link href="/signup" className="underline">
          Cadastre-se
        </Link>
      </p>
    </main>
  )
}
