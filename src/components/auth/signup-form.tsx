"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth/auth-client"

export function SignupForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    const form = new FormData(event.currentTarget)
    const name = String(form.get("name") || "")
    const email = String(form.get("email") || "")
    const password = String(form.get("password") || "")

    const result = await authClient.signUp.email({ name, email, password })
    setPending(false)

    if (result.error) {
      setError(result.error.message || "Não foi possível criar a conta.")
      return
    }

    router.push("/account")
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block space-y-1 text-sm">
        <span className="text-zinc-700">Nome</span>
        <input
          name="name"
          type="text"
          required
          autoComplete="name"
          minLength={2}
          className="w-full rounded-md border border-zinc-300 px-3 py-2"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-zinc-700">E-mail</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-md border border-zinc-300 px-3 py-2"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-zinc-700">Senha (mín. 10)</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={10}
          className="w-full rounded-md border border-zinc-300 px-3 py-2"
        />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Criando…" : "Criar conta"}
      </button>
    </form>
  )
}
