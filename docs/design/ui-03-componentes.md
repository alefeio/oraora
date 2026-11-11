# UI-03 — Especificação visual de componentes

Cada componente: aparência AB mix. **Comportamento funcional imutável.**

## Button / ButtonLink

1. **Finalidade:** ações primárias/secundárias e navegação em forma de botão (destinos atuais).  
2. **AB:** AB-1 radius ~0.85rem + leve elevação; AB-2 radius ~0.35rem, flat. Mix: radius-md AB-1 em CTAs; AB-2 em admin.  
3. **Tokens:** primary, on-primary, surface, border-strong, primary-disabled-bg.  
4. **Variantes:** primary, secondary, ghost, danger. Sizes sm/md/lg.  
5. **Estados:** default, hover, active, focus-visible, disabled, loading (label «…» preservada).  
6. **A11y:** contraste AA; min-h 44px; disabled não focável como ação.  
7. **Responsivo:** full-width opcional em mobile para CTAs hero/auth.  
8. **Imutável:** `href`, `type`, handlers, disabled semantics, textos de ação.

## Link (texto)

1. Navegação textual (auth footers, «voltar», esqueci senha).  
2. Primary + underline-offset; AB-2 pode usar underline gold só no ativo de nav.  
3. Tokens: brand-primary, focus.  
4. Default / hover / focus.  
5. —  
6. Contraste AA; não usar coral.  
7. —  
8. Destinos e copy normativa intactos.

## Field / Input / Textarea / Select

1. Entrada de dados nos forms existentes.  
2. AB-1: fundo soft + radius maior; AB-2: white + radius menor. Mix: soft em auth (AB-1), white em admin.  
3. Tokens: surface/soft, border-strong, text-*, danger.  
4. Text, password, email, textarea, select.  
5. Default, focus, error (+ FormError), disabled.  
6. Label sempre visível; erro com `role="alert"`; hint muted AA.  
7. Controles 100% largura no container.  
8. `name`, required, minLength, validações e mensagens normativas.

## Card / superfícies alternativas

1. Agrupar conteúdo interativo ou formulário.  
2. AB-1: card soft shadow; AB-2: preferir divisor/lista; card só em forms/intenção.  
3. Tokens: surface, border, shadow-soft (AB-1).  
4. Card, SoftPanel, DividerRow.  
5. Hover sutil só se clicável (feed).  
6. Não usar card só para decoração.  
7. Empilhar em mobile.  
8. Markup/links/`href` dos itens do feed preservados.

## Badge

1. Categoria/status compacto.  
2. Soft fills + texto primary/success/warning/danger (nunca gold/coral/sage texto).  
3. Tokens: info-soft, success-soft, etc.  
4. tones atuais.  
5. —  
6. Texto legível; não só cor.  
7. Wrap ok.  
8. Valores/outcomes exibidos sem mudar significado (rótulos técnicos podem ganhar apresentação amigável **somente** se copy já existir — senão manter).

## Banner de status

1. Feedback de oração/auth.  
2. Soft + borda leve; tipografia Inter.  
3. success/warning/danger soft.  
4. —  
5. —  
6. `role="status"` / alert conforme atual.  
7. Full width do main.  
8. Textos de pending/accepted/rejected **normativos** intactos.

## EmptyState

1. Feed/lista vazia.  
2. AB-1 soft panel; AB-2 dashed hairline + tipografia.  
3. surface-soft, border-strong, text-*.  
4. —  
5. —  
6. Título + descrição.  
7. —  
8. Mensagens e CTAs existentes.

## Skeleton

1. Loading Suspense.  
2. Substituir texto «Carregando…» por blocos soft pulsantes (visual only).  
3. surface-soft.  
4. —  
5. reduced-motion: estático.  
6. Não anunciar como conteúdo.  
7. —  
8. Mesmos pontos de Suspense; sem mudar data fetching.

## Header (SiteHeader)

1. Nav pública/app.  
2. AB mix: logo + links; ativo com peso/underline gold (AB-2) ou cor primary (AB-1).  
3. surface/blur opcional AB-1; hairline AB-2.  
4. mode public | app.  
5. —  
6. `aria-label="Principal"`; **mostrar Encontrar também em mobile** (correção visual de descoberta — mesmo destino).  
7. Wrap; sem hamburger novo (não novo destino).  
8. Hrefs: `/encontrar`, `/login`, `/signup`, `/pedir`, `/account` apenas.

## Footer

1. Marca + essência + disclaimer.  
2. AB-2 tipográfico; AB-1 soft top border.  
3. —  
4. —  
5. —  
6. —  
7. —  
8. Copy institucional/disclaimer existente.

## AuthShell

1. Cascas login/signup/recuperação/verificação.  
2. AB-1 card elevado; AB-2 form aberto com respiro. Mix: card leve (AB-1) + tipografia título AB-2.  
3. Logo oficial.  
4. —  
5. —  
6. H1 único; foco no primeiro campo.  
7. max-w-md centrado.  
8. Children/forms intactos.

## Navegação / filtros (chips)

1. Categorias do feed.  
2. AB-1 pills; AB-2 underline tabs. Mix: pills em mobile (toque), underline ok desktop.  
3. primary / surface.  
4. active/inactive.  
5. —  
6. Alvos ≥44px altura.  
7. scroll-x preservado.  
8. Query `?category=` e labels de categoria intactos.

## Pedidos e intercessão (composições)

1. Feed item, detalhe, compose, pedir, status.  
2. Leitura contemplativa (AB-2) + CTA evidente (AB-1).  
3. —  
4. —  
5. pending/error/success dos forms.  
6. —  
7. —  
8. Campos, elegibilidade, scripture opcional, idempotency, redirects — **inalterados**.

## Admin

1. Revisão operacional.  
2. Densidade alta; radius menor (AB-2); contraste máximo; sem glow.  
3. —  
4. —  
5. —  
6. Legibilidade > ornamentação.  
7. Tabelas/listas scrolláveis.  
8. Ações de validação intactas.
