"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Field, FormError, TextInput } from "@/components/ui/field"
import { authClient } from "@/lib/auth/auth-client"

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    const form = new FormData(event.currentTarget)
    const email = String(form.get("email") || "")
    const password = String(form.get("password") || "")

    const result = await authClient.signIn.email({ email, password })
    setPending(false)

    if (result.error) {
      setError(result.error.message || "Não foi possível entrar.")
      return
    }

    router.push("/account")
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="E-mail">
        <TextInput name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label="Senha">
        <TextInput
          name="password"
          type="password"
          required
          autoComplete="current-password"
          minLength={10}
        />
      </Field>
      {error ? <FormError>{error}</FormError> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  )
}
