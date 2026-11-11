"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Field, FormError, TextInput } from "@/components/ui/field"
import { authClient } from "@/lib/auth/auth-client"
import { AUTH_PATHS } from "@/lib/auth/safe-callback"

function isEmailNotVerifiedError(message: string | undefined): boolean {
  if (!message) return false
  return /email.*(not verified|não verific)|não verificad|unverified/i.test(message)
}

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    setUnverifiedEmail(null)
    const form = new FormData(event.currentTarget)
    const email = String(form.get("email") || "")
    const password = String(form.get("password") || "")

    const result = await authClient.signIn.email({
      email,
      password,
      callbackURL: AUTH_PATHS.account,
    })
    setPending(false)

    if (result.error) {
      const message = result.error.message || "Não foi possível entrar."
      if (isEmailNotVerifiedError(message)) {
        setUnverifiedEmail(email)
        setError("Confirme seu e-mail antes de entrar.")
        return
      }
      setError(message)
      return
    }

    router.push(AUTH_PATHS.account)
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
      <div className="flex justify-end">
        <Link
          href={AUTH_PATHS.forgotPassword}
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          Esqueci minha senha
        </Link>
      </div>
      {error ? <FormError>{error}</FormError> : null}
      {unverifiedEmail ? (
        <p className="text-sm text-text-secondary">
          <Link
            href={`${AUTH_PATHS.confirmEmail}?email=${encodeURIComponent(unverifiedEmail)}`}
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Reenviar verificação
          </Link>
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  )
}
