import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/auth/policy"

export function validateNewPassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `A senha deve ter no máximo ${MAX_PASSWORD_LENGTH} caracteres.`
  }
  return null
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): string | null {
  if (password !== confirmation) {
    return "A confirmação não coincide com a nova senha."
  }
  return null
}

/** Mensagem pública neutra — não revela se o e-mail existe. */
export const PASSWORD_RESET_REQUEST_ACK =
  "Se houver uma conta com este e-mail, enviamos instruções para redefinir a senha."
