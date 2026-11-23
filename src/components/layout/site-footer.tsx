import Link from "next/link"
import {
  PRODUCT_DISPLAY_NAME,
  PRODUCT_ESSENCE,
  PRODUCT_PRINCIPLE,
  PRODUCT_TAGLINE,
} from "@/lib/config/product"

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface/70">
      <div className="layout-shell grid gap-3 py-4 sm:grid-cols-[minmax(11rem,0.7fr)_1.3fr] sm:gap-x-7 sm:py-5">
        <div className="grid gap-0.5">
          <Link
            href="/"
            className="font-display text-[1.05rem] font-extrabold tracking-tight text-primary no-underline"
          >
            {PRODUCT_DISPLAY_NAME}
          </Link>
          <p className="m-0 text-[0.9rem] font-semibold text-text-primary">{PRODUCT_TAGLINE}</p>
        </div>
        <div className="grid gap-2">
          <p className="m-0 max-w-xl text-[0.88rem] leading-6 text-text-secondary">{PRODUCT_ESSENCE}</p>
          <p className="brand-principle m-0 text-[0.88rem]">{PRODUCT_PRINCIPLE}</p>
          <p className="m-0 max-w-2xl text-[0.78rem] leading-5 text-text-muted">
            Ambiente em desenvolvimento. Oração e reciprocidade já existem; solidariedade financeira
            ainda não está disponível.
          </p>
        </div>
      </div>
    </footer>
  )
}
