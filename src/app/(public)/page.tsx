import { BrandLogo } from "@/components/brand/logo"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { ButtonLink } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  PRODUCT_DISPLAY_NAME,
  PRODUCT_ESSENCE,
  PRODUCT_PRINCIPLE,
  PRODUCT_TAGLINE,
} from "@/lib/config/product"

export default function HomePage() {
  return (
    <>
      <SiteHeader mode="public" />
      <main>
        <section className="brand-hero-surface relative overflow-hidden border-b border-border">
          <div className="brand-hero-glow pointer-events-none absolute inset-0" />
          <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-4 py-14 text-center sm:px-6 sm:py-20">
            <BrandLogo href={null} size="lg" priority />
            <div className="space-y-4">
              <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight text-primary sm:text-5xl">
                {PRODUCT_TAGLINE}
              </h1>
              <p className="mx-auto max-w-2xl text-base leading-7 text-text-secondary sm:text-lg">
                No {PRODUCT_DISPLAY_NAME}, você conhece a história de alguém, oferece uma oração
                individual e participa de uma comunidade de fé, acolhimento e solidariedade.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <ButtonLink href="/encontrar" size="lg">
                Encontrar alguém para orar
              </ButtonLink>
              <ButtonLink href="/signup" variant="secondary" size="lg">
                Criar minha conta
              </ButtonLink>
            </div>
            <p className="max-w-xl text-sm font-medium text-primary">{PRODUCT_PRINCIPLE}</p>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-12 sm:grid-cols-3 sm:px-6">
          <Card>
            <h2 className="text-lg font-bold text-primary">Conhecer</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Leia a história e a intenção específica de oração de outra pessoa, com respeito e
              cuidado.
            </p>
          </Card>
          <Card>
            <h2 className="text-lg font-bold text-primary">Orar</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Escreva uma intercessão individual. Se quiser, escolha uma passagem bíblica para
              acompanhar.
            </p>
          </Card>
          <Card>
            <h2 className="text-lg font-bold text-primary">Pedir</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Depois de cuidar de alguém, você também pode compartilhar o seu pedido com a
              comunidade.
            </p>
          </Card>
        </section>

        <section className="border-y border-border bg-surface">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-12 text-center sm:px-6">
            <p className="text-sm font-semibold tracking-wide text-accent-coral uppercase">
              Essência
            </p>
            <p className="text-2xl font-bold text-primary sm:text-3xl">{PRODUCT_ESSENCE}</p>
            <p className="text-sm leading-6 text-text-secondary">
              O {PRODUCT_DISPLAY_NAME} existe para aproximar pessoas pela oração — com respeito,
              reciprocidade e cuidado concreto.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
