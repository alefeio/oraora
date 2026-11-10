import {
  createAuthEmailTransport,
  type AuthEmailPayload,
  type AuthEmailTransport,
} from "@/lib/auth/email-transport"

export type { AuthEmailMessage } from "@/lib/auth/email-messages"
export { passwordResetEmail, verificationEmail } from "@/lib/auth/email-messages"
export {
  AuthEmailConfigurationError,
  AuthEmailDeliveryError,
  assertHostedAuthEmailReady,
  createAuthEmailTransport,
  createMockAuthEmailTransport,
  isHostedRuntime,
  publicSignupEnabled,
  resolveAuthEmailMode,
} from "@/lib/auth/email-transport"

let defaultTransport: AuthEmailTransport | null = null

/** Permite injetar transporte mockável nos testes. */
export function setAuthEmailTransportForTests(transport: AuthEmailTransport | null) {
  defaultTransport = transport
}

function resolveTransport() {
  return defaultTransport ?? createAuthEmailTransport()
}

/**
 * Entrega de e-mail de autenticação.
 * - Local: modo `console` (arquivo em tmp/, sem uso em Vercel).
 * - Hospedado: apenas `resend` com chave e remetente do projeto.
 * Erros de configuração/entrega são propagados; nunca fingir sucesso.
 */
export async function sendAuthEmail(
  input: AuthEmailPayload,
  transport: AuthEmailTransport = resolveTransport(),
): Promise<void> {
  await transport.send(input)
}
