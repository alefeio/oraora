import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { ButtonLink } from "@/components/ui/button"
import {
  PRODUCT_DISPLAY_NAME,
  PRODUCT_ESSENCE,
  PRODUCT_PRINCIPLE,
} from "@/lib/config/product"

const PATH_STEPS = [
  {
    n: "01",
    title: "Conhecer",
    body: "Leia a história e a intenção específica de oração de outra pessoa, com respeito e cuidado.",
  },
  {
    n: "02",
    title: "Orar",
    body: "Escreva uma intercessão individual. Se quiser, escolha uma passagem bíblica para acompanhar.",
  },
  {
    n: "03",
    title: "Pedir",
    body: "Depois de cuidar de alguém, você também pode compartilhar o seu pedido com a comunidade.",
  },
] as const

export default function HomePage() {
  return (
    <>
      <SiteHeader mode="public" />
      <main className="min-w-0">
        <section className="py-10 sm:py-14">
          <div className="layout-shell grid items-center gap-7 lg:grid-cols-[1.12fr_0.88fr] lg:gap-14">
            <div className="grid justify-items-start gap-3.5">
              <p className="brand-kicker">
                <i className="brand-kicker-dot" aria-hidden="true" />
                Essência
              </p>
              <h1 className="max-w-[16ch] text-[clamp(1.75rem,6vw,2.25rem)] font-extrabold text-primary sm:max-w-[16ch] sm:text-[clamp(2rem,4vw,3rem)] lg:max-w-[16ch]">
                {PRODUCT_ESSENCE}
              </h1>
              <hr className="brand-rule" />
              <p className="m-0 max-w-[42rem] text-base leading-7 text-text-secondary sm:text-lg">
                No {PRODUCT_DISPLAY_NAME}, você conhece a história de alguém, oferece uma oração
                individual e participa de uma comunidade de fé, acolhimento e solidariedade.
              </p>
              <div className="flex w-full flex-wrap gap-2.5 sm:w-auto [&_a]:w-full sm:[&_a]:w-auto">
                <ButtonLink href="/encontrar" size="lg">
                  Encontrar alguém para orar
                </ButtonLink>
                <ButtonLink href="/signup" variant="secondary" size="lg">
                  Criar minha conta
                </ButtonLink>
              </div>
              <p className="brand-principle text-sm sm:text-base">{PRODUCT_PRINCIPLE}</p>
            </div>

            <ol className="m-0 list-none divide-y divide-border rounded-lg bg-surface px-5 py-1.5 shadow-[var(--shadow-soft)]">
              {PATH_STEPS.map((step) => (
                <li key={step.n} className="grid grid-cols-[auto_1fr] gap-3.5 py-4">
                  <span className="font-display text-[1.15rem] font-extrabold text-primary">
                    {step.n}
                  </span>
                  <div>
                    <h2 className="m-0 text-lg font-bold text-primary">{step.title}</h2>
                    <p className="mt-1.5 mb-0 text-[0.95rem] leading-6 text-text-secondary">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-y border-border bg-surface-muted">
          <div className="mx-auto w-[min(44rem,calc(100%-2.5rem))] py-9">
            <p className="m-0 text-[1.05rem] leading-7 text-text-secondary">
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
