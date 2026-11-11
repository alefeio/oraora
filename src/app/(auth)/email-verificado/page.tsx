import { Suspense } from "react"
import { AuthShell } from "@/components/auth/auth-shell"
import { EmailVerifiedPanel } from "@/components/auth/email-verified-panel"

export default function EmailVerifiedPage() {
  return (
    <AuthShell title="Verificação de e-mail" subtitle="Status da confirmação da sua conta">
      <Suspense fallback={<p className="text-sm text-text-secondary">Carregando…</p>}>
        <EmailVerifiedPanel />
      </Suspense>
    </AuthShell>
  )
}
