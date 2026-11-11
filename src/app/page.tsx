import Image from "next/image"
import {
  BRAND_LOGO_PATH,
  PRODUCT_DISPLAY_NAME,
  PRODUCT_ESSENCE,
  PRODUCT_PRINCIPLE,
  PRODUCT_STATUS,
  PRODUCT_TAGLINE,
} from "@/lib/brand"

export default function HomePage() {
  return (
    <div className="relative min-h-full overflow-hidden bg-brand-cream text-text-primary">
      <div
        aria-hidden
        className="anim-glow pointer-events-none absolute -left-24 top-[-8rem] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(83,62,126,0.22),transparent_68%)]"
      />
      <div
        aria-hidden
        className="anim-drift pointer-events-none absolute -right-16 top-40 h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,rgba(244,178,92,0.28),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(100vh,52rem)] bg-[linear-gradient(180deg,rgba(252,247,238,0.15)_0%,rgba(246,240,230,0.55)_48%,rgba(252,247,238,1)_100%)]"
      />

      <main>
        <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 pb-24 pt-16 sm:px-8">
          <div className="anim-rise">
            <Image
              src={BRAND_LOGO_PATH}
              alt={PRODUCT_DISPLAY_NAME}
              width={280}
              height={84}
              priority
              className="h-16 w-auto sm:h-20"
            />
          </div>
          <h1 className="anim-rise mt-10 max-w-3xl text-4xl font-extrabold leading-[1.08] text-primary sm:text-5xl lg:text-6xl">
            {PRODUCT_TAGLINE}
          </h1>
          <p className="anim-rise-delay mt-6 max-w-2xl text-lg leading-8 text-text-secondary sm:text-xl">
            {PRODUCT_ESSENCE}
          </p>
        </section>

        <section className="relative z-10 border-t border-border">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-20 sm:px-8 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="text-3xl font-bold text-primary sm:text-4xl">
                Por que o Ora Ora existe
              </h2>
              <p className="mt-5 text-base leading-7 text-text-secondary sm:text-lg">
                O Ora Ora nasce para aproximar pessoas pela fé: um espaço em que
                pedir e oferecer oração fazem parte do mesmo cuidado. Aqui, a
                solidariedade começa no gesto simples de interceder por alguém.
              </p>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-primary sm:text-4xl">
                Pessoas orando umas pelas outras
              </h2>
              <p className="mt-5 text-base leading-7 text-text-secondary sm:text-lg">
                Imaginamos uma rede acolhedora, em que pedidos e orações circulam
                com respeito e esperança. Sem promessas de milagres. Sem
                transformar doação em pagamento por oração.
              </p>
            </div>
          </div>
        </section>

        <section className="relative z-10 border-t border-border bg-[linear-gradient(180deg,#f8f2e8_0%,#fcf7ee_100%)]">
          <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-coral">
              Princípio
            </p>
            <p className="mt-4 max-w-3xl text-3xl font-bold leading-snug text-primary sm:text-4xl">
              {PRODUCT_PRINCIPLE}
            </p>
            <p className="mt-5 max-w-2xl text-base leading-7 text-text-secondary">
              A reciprocidade espiritual não é troca comercial. É cuidado
              mútuo: antes de pedir, também oramos.
            </p>
          </div>
        </section>

        <section className="relative z-10 bg-primary text-text-on-primary">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-16 sm:px-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold sm:text-4xl">Em preparação</h2>
              <p className="mt-4 text-base leading-7 text-[rgba(252,247,238,0.88)] sm:text-lg">
                {PRODUCT_STATUS}
              </p>
            </div>
            <p className="text-sm font-medium tracking-wide text-brand-gold">
              oraora.ia.br
            </p>
          </div>
        </section>
      </main>

      <footer className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-10 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <p className="font-semibold text-primary">{PRODUCT_DISPLAY_NAME}</p>
          <p>{PRODUCT_TAGLINE}</p>
        </div>
        <p className="text-text-muted">
          © 2026 Ora Ora. Conteúdo institucional.
        </p>
      </footer>
    </div>
  )
}
