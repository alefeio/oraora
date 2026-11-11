"use client"

import { FormEvent, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Field, FormError, FormHint, TextInput } from "@/components/ui/field"
import { authClient } from "@/lib/auth/auth-client"
import {
  validateNewPassword,
  validatePasswordConfirmation,
} from "@/lib/auth/password-form"
import { AUTH_PATHS } from "@/lib/auth/safe-callback"
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/policy"

function tokenErrorMessage(code: string | null): string {
  if (!code) return "Link de redefinição inválido ou incompleto."
  const normalized = code.toLowerCase()
  if (normalized.includes("expir")) {
    return "Este link de redefinição expirou. Solicite um novo."
  }
  return "Este link de redefinição é inválido ou já foi utilizado. Solicite um novo."
}

export function ResetPasswordForm() {
  const router = useRouter()
  const search = useSearchParams()
  const token = search.get("token")
  const errorParam = search.get("error")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const blockedReason = useMemo(() => {
    if (errorParam) return tokenErrorMessage(errorParam)
    if (!token) return tokenErrorMessage(null)
    return null
  }, [errorParam, token])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || blockedReason) return

    setPending(true)
    setError(null)
    const form = new FormData(event.currentTarget)
    const password = String(form.get("password") || "")
    const confirmation = String(form.get("confirmation") || "")

    const passwordError = validateNewPassword(password)
    if (passwordError) {
      setError(passwordError)
      setPending(false)
      return
    }
    const confirmError = validatePasswordConfirmation(password, confirmation)
    if (confirmError) {
      setError(confirmError)
      setPending(false)
      return
    }

    try {
      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      })
      if (result.error) {
        setError(result.error.message || tokenErrorMessage("INVALID_TOKEN"))
        setPending(false)
        return
      }
      setDone(true)
      setPending(false)
      window.setTimeout(() => {
        router.push(AUTH_PATHS.login)
        router.refresh()
      }, 1200)
    } catch {
      setError("Não foi possível redefinir a senha agora. Tente novamente.")
      setPending(false)
    }
  }

  if (blockedReason) {
    return (
      <div className="space-y-3">
        <FormError>{blockedReason}</FormError>
        <FormHint>
          Você pode solicitar um novo link em{" "}
          <a href={AUTH_PATHS.forgotPassword} className="font-medium text-primary underline-offset-2 hover:underline">
            Esqueci minha senha
          </a>
          .
        </FormHint>
      </div>
    )
  }

  if (done) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">Senha atualizada.</p>
        <p className="text-sm text-text-secondary">
          Sessões anteriores foram encerradas. Redirecionando para o login…
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label={`Nova senha (mín. ${MIN_PASSWORD_LENGTH})`}>
        <TextInput
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
        />
      </Field>
      <Field label="Confirmar nova senha">
        <TextInput
          name="confirmation"
          type="password"
          required
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
        />
      </Field>
      {error ? <FormError>{error}</FormError> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Salvando…" : "Redefinir senha"}
      </Button>
    </form>
  )
}
