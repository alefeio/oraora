import Link from "next/link"
import { LogoutButton } from "@/components/auth/logout-button"
import { requireUser } from "@/lib/auth/session"
import { PRODUCT_DISPLAY_NAME } from "@/lib/config/product"

export default async function AccountPage() {
  const session = await requireUser()

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-col gap-6 px-6 py-16">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900">Minha conta</h1>
        <p className="text-sm text-zinc-600">{PRODUCT_DISPLAY_NAME} · sessão autenticada</p>
      </div>
      <dl className="space-y-3 rounded-lg border border-zinc-200 p-4 text-sm">
        <div>
          <dt className="text-zinc-500">Nome</dt>
          <dd className="font-medium text-zinc-900">{session.user.name}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">E-mail</dt>
          <dd className="font-medium text-zinc-900">{session.user.email}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Papel</dt>
          <dd className="font-medium text-zinc-900">{session.user.role ?? "USER"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">E-mail verificado</dt>
          <dd className="font-medium text-zinc-900">
            {session.user.emailVerified ? "sim" : "não (modo desenvolvimento)"}
          </dd>
        </div>
      </dl>
      <p className="text-sm text-zinc-600">
        Pedidos, orações, campanhas e carteira ainda não estão disponíveis nesta fundação.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/" className="rounded-md border border-zinc-300 px-4 py-2 text-sm">
          Início
        </Link>
        <LogoutButton />
      </div>
    </main>
  )
}
