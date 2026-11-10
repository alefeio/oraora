/**
 * Identidade oficial do produto.
 * Nomes de entidades Prisma / rotas de API permanecem estáveis independentemente da marca.
 */
export const PRODUCT_DISPLAY_NAME =
  process.env.NEXT_PUBLIC_PRODUCT_DISPLAY_NAME?.trim() || "Ora Ora"

export const PRODUCT_TAGLINE = "Pessoas que oram umas pelas outras."

export const PRODUCT_ESSENCE =
  "A fé aproxima pessoas. O cuidado se transforma em solidariedade."

export const PRODUCT_PRINCIPLE = "Antes de pedir uma oração, ore por alguém."

export const PRODUCT_WORKING_TITLE = "Rede de Intercessão Solidária"

/** @deprecated Nome oficial definido — mantido apenas para compatibilidade de imports legados. */
export const PRODUCT_NAME_IS_PROVISIONAL = false

export const BRAND_LOGO_PATH = "/logo.png"

/** Ícone quadrado derivado do símbolo (não substitui a logomarca completa). */
export const BRAND_ICON_PATH = "/icon-square.png"
