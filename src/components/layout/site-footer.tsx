import { BrandLogo } from "@/components/brand/logo"
import { PRODUCT_ESSENCE, PRODUCT_PRINCIPLE } from "@/lib/config/product"

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 sm:px-6">
        <BrandLogo size="sm" href="/" />
        <p className="max-w-xl text-sm leading-6 text-text-secondary">{PRODUCT_ESSENCE}</p>
        <p className="text-sm font-medium text-primary">{PRODUCT_PRINCIPLE}</p>
        <p className="text-xs text-text-muted">
          Ambiente em desenvolvimento. Oração e reciprocidade já existem; solidariedade financeira
          ainda não está disponível.
        </p>
      </div>
    </footer>
  )
}
