"use client"

import { useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { ButtonLink } from "@/components/ui/button"
import { FormError, FormHint } from "@/components/ui/field"
import { AuthTextLink } from "@/components/auth/auth-shell"
import {
  AUTH_PATHS,
  resolveEmailVerificationPageState,
} from "@/lib/auth/safe-callback"

export function EmailVerifiedPanel() {
  const search = useSearchParams()
  const error = search.get("error")
  const status = search.get("status")
  const verified = search.get("verified")

  const state = useMemo(() => {
    const kind = resolveEmailVerificationPageState({ error, status, verified })
    if (kind === "success") {
      return {
        kind,
        title: "E-mail confirmado",
        body: "Sua conta está verificada. Agora você pode entrar com sua senha.",
      }
    }
    if (kind === "error") {
      const normalized = (error || "").toLowerCase()
      if (normalized.includes("expir")) {
        return {
          kind,
          title: "Link expirado",
          body: "Este link de verificação expirou. Solicite um novo a partir do cadastro ou da tela de confirmação.",
        }
      }
      return {
        kind,
        title: "Link inválido ou já utilizado",
        body: "Não foi possível confirmar com este link. Se sua conta já estiver verificada, basta entrar.",
      }
    }
    return {
      kind,
      title: "Confirmação pendente",
      body: "Abra o link enviado por e-mail para concluir a verificação. Abrir esta página diretamente não confirma a conta.",
    }
  }, [error, status, verified])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p
          className={`text-sm font-medium ${
            state.kind === "success"
              ? "text-primary"
              : state.kind === "error"
                ? "text-danger"
                : "text-text-primary"
          }`}
        >
          {state.title}
        </p>
        <p className="text-sm text-text-secondary">{state.body}</p>
      </div>
      {state.kind === "error" ? (
        <FormError>Verificação não concluída por este link.</FormError>
      ) : null}
      {state.kind === "pending" ? (
        <FormHint>
          Depois de clicar no e-mail, você deve ver a confirmação de sucesso. Se o link falhar,
          use{" "}
          <AuthTextLink href={AUTH_PATHS.confirmEmail}>Confirme seu e-mail</AuthTextLink>.
        </FormHint>
      ) : null}
      <ButtonLink href={AUTH_PATHS.login} className="w-full">
        Entrar na minha conta
      </ButtonLink>
      {state.kind === "error" ? (
        <FormHint>
          Precisa de um novo e-mail? Volte a{" "}
          <AuthTextLink href={AUTH_PATHS.confirmEmail}>Confirme seu e-mail</AuthTextLink>.
        </FormHint>
      ) : null}
    </div>
  )
}
