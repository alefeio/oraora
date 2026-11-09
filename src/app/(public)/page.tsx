import Link from "next/link"
import { PRODUCT_DISPLAY_NAME, PRODUCT_WORKING_TITLE } from "@/lib/config/product"

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <p className="text-sm tracking-wide text-zinc-500 uppercase">Fundação técnica · Sprint F</p>
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">{PRODUCT_DISPLAY_NAME}</h1>
        <p className="text-lg text-zinc-600">{PRODUCT_WORKING_TITLE}</p>
        <p className="text-sm text-amber-800">
          Nome provisório. Não consolide marca, domínio ou identidade visual ainda.
        </p>
      </div>
      <p className="max-w-2xl text-base leading-7 text-zinc-700">
        Antes de pedir que alguém ore por você, ore por alguém. Esta sprint configura autenticação,
        banco e contratos — sem fluxos de oração, campanhas ou carteira.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/encontrar"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Encontrar alguém para orar
        </Link>
        <Link
          href="/signup"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900"
        >
          Criar conta
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900"
        >
          Entrar
        </Link>
        <Link
          href="/account"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900"
        >
          Minha conta
        </Link>
      </div>
    </main>
  )
}
