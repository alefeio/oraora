/**
 * Bounded context: Wallet
 * Ledger auditável futuro. Saldo NÃO será campo mutável em User.
 * Sprint F: não implementado.
 */
export const WALLET_CONTEXT = "wallet" as const

export const WALLET_LEDGER_DIRECTIVE =
  "Financial balances must be derived from an auditable ledger, never a mutable User.balance field."
