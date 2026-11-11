"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FormError, FormHint } from "@/components/ui/field"
import { authClient } from "@/lib/auth/auth-client"
import { AUTH_PATHS, authRedirectPath } from "@/lib/auth/safe-callback"

export function ConfirmEmailPanel() {
  const search = useSearchParams()
  const email = useMemo(() => search.get("email")?.trim() || "", [search])
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function resend() {
    if (!email) {
      setError("Informe o e-mail usado no cadastro para reenviar a verificação.")
      return
    }
    setPending(true)
    setError(null)
    setMessage(null)
    try {
      const result = await authClient.sendVerificationEmail({
        email,
        callbackURL: authRedirectPath(AUTH_PATHS.emailVerified),
      })
      if (result.error) {
        setError("Não foi possível reenviar agora. Aguarde um momento e tente de novo.")
      } else {
        setMessage("Se a conta existir e ainda precisar de verificação, enviamos um novo e-mail.")
      }
    } catch {
      setError("Falha ao solicitar o reenvio. Tente novamente em instantes.")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        Enviamos um link de verificação{email ? ` para ${email}` : ""}. Abra o e-mail e confirme
        sua conta antes de entrar.
      </p>
      <FormHint>
        O link aponta para este ambiente Preview. Se você abrir um deployment antigo, a confirmação
        pode parecer incompleta — use sempre o e-mail mais recente.
      </FormHint>
      {message ? <p className="text-sm font-medium text-primary">{message}</p> : null}
      {error ? <FormError>{error}</FormError> : null}
      <Button type="button" onClick={resend} disabled={pending || !email} className="w-full">
        {pending ? "Reenviando…" : "Reenviar e-mail de verificação"}
      </Button>
    </div>
  )
}
