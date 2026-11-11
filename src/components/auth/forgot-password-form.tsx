"use client"

import { FormEvent, useState } from "react"
import { Button } from "@/components/ui/button"
import { Field, FormError, FormHint, TextInput } from "@/components/ui/field"
import { authClient } from "@/lib/auth/auth-client"
import {
  PASSWORD_RESET_REQUEST_ACK,
} from "@/lib/auth/password-form"
import { AUTH_PATHS, authRedirectPath } from "@/lib/auth/safe-callback"

export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    const form = new FormData(event.currentTarget)
    const email = String(form.get("email") || "").trim()

    try {
      // Sempre concluir com ack neutro (existência do e-mail não é revelada).
      await authClient.requestPasswordReset({
        email,
        redirectTo: authRedirectPath(AUTH_PATHS.resetPassword),
      })
      setDone(true)
    } catch {
      setError("Não foi possível solicitar a recuperação agora. Tente novamente em instantes.")
    } finally {
      setPending(false)
    }
  }

  if (done) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-text-secondary">{PASSWORD_RESET_REQUEST_ACK}</p>
        <FormHint>
          Se o e-mail não chegar em alguns minutos, confira a caixa de spam ou tente de novo
          mais tarde.
        </FormHint>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="E-mail" hint="Usaremos este endereço apenas se houver conta associada.">
        <TextInput name="email" type="email" required autoComplete="email" />
      </Field>
      {error ? <FormError>{error}</FormError> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Enviando…" : "Enviar link de recuperação"}
      </Button>
    </form>
  )
}
