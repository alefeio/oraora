"use client"

import { useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { ButtonLink } from "@/components/ui/button"
import { FormError, FormHint } from "@/components/ui/field"
import { AuthTextLink } from "@/components/auth/auth-shell"
import { AUTH_PATHS } from "@/lib/auth/safe-callback"

export function EmailVerifiedPanel() {
  const search = useSearchParams()
  const error = search.get("error")

  const state = useMemo(() => {
    if (!error) {
      return {
        ok: true as const,
        title: "E-mail confirmado",
        body: "Sua conta está verificada. Agora você pode entrar com sua senha.",
      }
    }
    const normalized = error.toLowerCase()
    if (normalized.includes("expir")) {
      return {
        ok: false as const,
        title: "Link expirado",
        body: "Este link de verificação expirou. Solicite um novo a partir do cadastro ou da tela de confirmação.",
      }
    }
    return {
      ok: false as const,
      title: "Link inválido ou já utilizado",
      body: "Não foi possível confirmar com este link. Se sua conta já estiver verificada, basta entrar.",
    }
  }, [error])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className={`text-sm font-medium ${state.ok ? "text-primary" : "text-danger"}`}>
          {state.title}
        </p>
        <p className="text-sm text-text-secondary">{state.body}</p>
      </div>
      {!state.ok ? <FormError>Verificação não concluída por este link.</FormError> : null}
      <ButtonLink href={AUTH_PATHS.login} className="w-full">
        Entrar na minha conta
      </ButtonLink>
      {!state.ok ? (
        <FormHint>
          Precisa de um novo e-mail? Volte a{" "}
          <AuthTextLink href={AUTH_PATHS.confirmEmail}>Confirme seu e-mail</AuthTextLink>.
        </FormHint>
      ) : null}
    </div>
  )
}
