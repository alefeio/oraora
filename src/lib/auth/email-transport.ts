import { appendFile, mkdir } from "node:fs/promises"
import path from "node:path"
import type { AuthEmailMessage } from "@/lib/auth/email-messages"

export type AuthEmailPayload = AuthEmailMessage & { to: string }

export type AuthEmailTransport = {
  readonly mode: "console" | "resend" | "mock"
  send(message: AuthEmailPayload): Promise<void>
}

export class AuthEmailConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AuthEmailConfigurationError"
  }
}

export class AuthEmailDeliveryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AuthEmailDeliveryError"
  }
}

type EnvLike = Record<string, string | undefined>

const DISALLOWED_FROM_HOSTS = new Set(["gmail.com", "googlemail.com"])

export function isHostedRuntime(env: EnvLike = process.env): boolean {
  return Boolean(env.VERCEL || env.VERCEL_ENV)
}

export function resolveAuthEmailMode(env: EnvLike = process.env): "console" | "resend" {
  const raw = env.AUTH_EMAIL_MODE?.trim().toLowerCase()
  if (!raw) return isHostedRuntime(env) ? "resend" : "console"
  if (raw === "console" || raw === "resend") return raw
  throw new AuthEmailConfigurationError(`AUTH_EMAIL_MODE inválido: ${raw}`)
}

/**
 * Precedência do remetente Resend:
 * 1. `RESEND_FROM` (contrato oficial)
 * 2. `AUTH_EMAIL_FROM` (fallback legado de compatibilidade)
 */
export function resolveResendFrom(env: EnvLike = process.env): string | null {
  const primary = env.RESEND_FROM?.trim()
  if (primary) return primary
  const legacy = env.AUTH_EMAIL_FROM?.trim()
  if (legacy) return legacy
  return null
}

function extractFromHost(from: string): string | null {
  const angle = from.match(/<([^>]+)>/)
  const email = (angle?.[1] || from).trim().toLowerCase()
  const at = email.lastIndexOf("@")
  if (at < 0) return null
  return email.slice(at + 1)
}

/** Remetentes de caixas pessoais (ex.: Gmail) não são aceitos na API Resend do produto. */
export function assertResendFromAllowed(from: string): void {
  const host = extractFromHost(from)
  if (!host) {
    throw new AuthEmailConfigurationError(
      "RESEND_FROM inválido. Use o formato `Ora Ora <contato@dominio-verificado>`.",
    )
  }
  if (DISALLOWED_FROM_HOSTS.has(host)) {
    throw new AuthEmailConfigurationError(
      "RESEND_FROM não pode usar caixa pessoal (ex.: Gmail). Configure um remetente do domínio verificado Ora Ora (contato@oraora.ia.br).",
    )
  }
}

/** Hospedagem só aceita Resend com chave e remetente próprios do projeto. */
export function assertHostedAuthEmailReady(env: EnvLike = process.env): void {
  if (!isHostedRuntime(env)) return
  const mode = resolveAuthEmailMode(env)
  if (mode !== "resend") {
    throw new AuthEmailConfigurationError(
      "Em ambientes hospedados (Vercel), AUTH_EMAIL_MODE=console é proibido. Configure AUTH_EMAIL_MODE=resend.",
    )
  }
  if (!env.RESEND_API_KEY?.trim()) {
    throw new AuthEmailConfigurationError(
      "RESEND_API_KEY ausente. Configure um provedor de e-mail do projeto Ora Ora antes do cadastro público.",
    )
  }
  const from = resolveResendFrom(env)
  if (!from) {
    throw new AuthEmailConfigurationError(
      "RESEND_FROM ausente. Configure o remetente verificado do projeto Ora Ora (fallback legado: AUTH_EMAIL_FROM).",
    )
  }
  assertResendFromAllowed(from)
}

export function publicSignupEnabled(env: EnvLike = process.env): boolean {
  if (!isHostedRuntime(env)) return true
  try {
    assertHostedAuthEmailReady(env)
    return true
  } catch {
    return false
  }
}

function createConsoleTransport(env: EnvLike): AuthEmailTransport {
  if (isHostedRuntime(env)) {
    throw new AuthEmailConfigurationError(
      "Modo console de e-mail não pode ser usado na Vercel.",
    )
  }

  return {
    mode: "console",
    async send(message) {
      const logPath =
        env.AUTH_EMAIL_LOG_PATH?.trim() ||
        path.join(process.cwd(), "tmp", "auth-emails.log")
      await mkdir(path.dirname(logPath), { recursive: true })
      // Em desenvolvimento local o texto completo (com link) fica só no arquivo local ignorado pelo Git.
      const line = JSON.stringify({
        at: new Date().toISOString(),
        to: message.to,
        subject: message.subject,
        text: message.text,
      })
      await appendFile(logPath, `${line}\n`, "utf8")
      // Log de processo: sem URL/token.
      console.info("auth email (console)", { to: message.to, subject: message.subject })
    },
  }
}

type FetchLike = typeof fetch

function createResendTransport(
  env: EnvLike,
  fetchImpl: FetchLike = fetch,
): AuthEmailTransport {
  const apiKey = env.RESEND_API_KEY?.trim()
  const from = resolveResendFrom(env)
  if (!apiKey || !from) {
    throw new AuthEmailConfigurationError(
      "AUTH_EMAIL_MODE=resend exige RESEND_API_KEY e RESEND_FROM (ou AUTH_EMAIL_FROM legado).",
    )
  }
  assertResendFromAllowed(from)

  return {
    mode: "resend",
    async send(message) {
      const response = await fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
        }),
      })

      if (!response.ok) {
        // Não incluir corpo completo (pode vazar metadados); só status.
        throw new AuthEmailDeliveryError(
          `Falha no envio de e-mail de autenticação (status ${response.status}).`,
        )
      }
    },
  }
}

export function createMockAuthEmailTransport(
  sink: AuthEmailPayload[] = [],
): AuthEmailTransport & { messages: AuthEmailPayload[] } {
  const transport: AuthEmailTransport & { messages: AuthEmailPayload[] } = {
    mode: "mock",
    messages: sink,
    async send(message) {
      sink.push(message)
    },
  }
  return transport
}

export function createAuthEmailTransport(
  env: EnvLike = process.env,
  options?: { fetchImpl?: FetchLike; mock?: AuthEmailTransport },
): AuthEmailTransport {
  if (options?.mock) return options.mock

  if (isHostedRuntime(env)) {
    assertHostedAuthEmailReady(env)
  }

  const mode = resolveAuthEmailMode(env)
  if (mode === "console") return createConsoleTransport(env)
  return createResendTransport(env, options?.fetchImpl)
}
