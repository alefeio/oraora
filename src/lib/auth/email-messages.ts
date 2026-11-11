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
