import { appendFile, mkdir } from "node:fs/promises"
import path from "node:path"
import { PRODUCT_DISPLAY_NAME } from "@/lib/config/product"

export type AuthEmailMessage = {
  subject: string
  html: string
  text: string
}

function brandName() {
  return PRODUCT_DISPLAY_NAME
}

export function verificationEmail(url: string): AuthEmailMessage {
  const subject = `Confirme seu e-mail — ${brandName()}`
  const text = [
    "Confirme seu e-mail para ativar sua conta.",
    "",
    url,
    "",
    "Se você não criou esta conta, ignore esta mensagem.",
  ].join("\n")
  const html = `<p>Confirme seu e-mail para ativar sua conta.</p><p><a href="${url}">Confirmar e-mail</a></p><p>Se você não criou esta conta, ignore esta mensagem.</p>`
  return { subject, html, text }
}

export function passwordResetEmail(url: string): AuthEmailMessage {
  const subject = `Redefina sua senha — ${brandName()}`
  const text = [
    "Recebemos um pedido para redefinir sua senha.",
    "",
    url,
    "",
    "Se você não pediu isso, ignore esta mensagem.",
  ].join("\n")
  const html = `<p>Recebemos um pedido para redefinir sua senha.</p><p><a href="${url}">Redefinir senha</a></p><p>Se você não pediu isso, ignore esta mensagem.</p>`
  return { subject, html, text }
}

function emailMode(env: Record<string, string | undefined> = process.env) {
  return (env.AUTH_EMAIL_MODE?.trim().toLowerCase() || "console") as "console" | "resend"
}

/**
 * Entrega de e-mail de autenticação.
 * Produção pública exige provedor real (Resend ou equivalente) e domínio verificado.
 */
export async function sendAuthEmail(
  input: AuthEmailMessage & { to: string },
  env: Record<string, string | undefined> = process.env,
): Promise<void> {
  const mode = emailMode(env)

  if (mode === "console") {
    const logPath =
      env.AUTH_EMAIL_LOG_PATH?.trim() ||
      path.join(process.cwd(), "tmp", "auth-emails.log")
    await mkdir(path.dirname(logPath), { recursive: true })
    const line = JSON.stringify({
      at: new Date().toISOString(),
      to: input.to,
      subject: input.subject,
      text: input.text,
    })
    await appendFile(logPath, `${line}\n`, "utf8")
    console.info("auth email (console)", { to: input.to, subject: input.subject })
    return
  }

  if (mode === "resend") {
    throw new Error(
      "AUTH_EMAIL_MODE=resend exige integração ativa; configure o provedor antes do uso público.",
    )
  }

  throw new Error(`AUTH_EMAIL_MODE inválido: ${mode}`)
}
