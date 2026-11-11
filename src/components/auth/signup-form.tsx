"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Field, FormError, TextInput } from "@/components/ui/field"
import { authClient } from "@/lib/auth/auth-client"
import { AUTH_PATHS, authRedirectPath } from "@/lib/auth/safe-callback"

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

    const result = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: authRedirectPath(AUTH_PATHS.emailVerifiedSuccess),
    })
    setPending(false)

    if (result.error) {
      setError(result.error.message || "Não foi possível criar a conta.")
      return
    }

    router.push(`${AUTH_PATHS.confirmEmail}?email=${encodeURIComponent(email)}`)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Nome">
        <TextInput name="name" type="text" required autoComplete="name" minLength={2} />
      </Field>
      <Field label="E-mail">
        <TextInput name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label="Senha (mín. 10)">
        <TextInput
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={10}
        />
      </Field>
      {error ? <FormError>{error}</FormError> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Criando…" : "Criar conta"}
      </Button>
    </form>
  )
}
