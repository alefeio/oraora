# GATE UI-01 — Auditoria visual

**Branch de planejamento:** `design/ui-redesign-discovery`  
**Base funcional:** `hardening/gate-2-6d-account-recovery` @ `dca1d1e435c53472231c2a493a84b1dd42b4d8a7`  
**Base institucional:** `release/prod-0-institucional` @ `91064edca6ca39fe15531d8dad22c3e8a2c4e2de`  
**Data:** 2026-11-11  

## Escopo e limites

Auditoria **somente visual**. Não propõe mudança de:

- reciprocidade, elegibilidade, jornada de intercessão;
- rotas, APIs, schema Prisma, permissões;
- textos normativos (obrigações/permissões).

### Referências de identidade usadas

| Fonte | Disponibilidade | Uso |
|---|---|---|
| `docs/brand/identity.md` | Presente no repo | Tokens, tipografia, regras de logo |
| `Arquivos/MiniGuia.png` | Presente | Mini-guia de marca (símbolo, paleta, tipografia) |
| «Ora Ora — Estratégia completa de UX/UI e experiência digital — V1.0» | **Não localizado** no workspace | Condição do gate: decisões orientadas pelo brief UI-01 + identidade oficial; pesquisa V1.0 deve ser anexada antes do UI-03 |

Direção pedida no brief: **Acolhimento contemplativo + Serenidade essencial**.

---

## 1. Inventário de telas

### 1.1 Site institucional (`release/prod-0-institucional`)

| Tela | Rota | Captura | Método |
|---|---|---|---|
| Landing institucional | `/` | `evidence/ui-01/prod0-desktop-hero.png`, `prod0-mobile-hero.png` | Runtime local PROD-0 + código |

### 1.2 App funcional (`hardening/gate-2-6d-account-recovery`)

| Tela | Rota | Captura | Método |
|---|---|---|---|
| Homepage pública | `/` | `ui01-homepage-desktop.png`, `ui01-homepage-mobile.png` | Runtime local `localhost:3020` |
| Login | `/login` | `ui01-login-desktop.png` | Runtime local |
| Cadastro | `/signup` | `ui01-signup-desktop.png` | Runtime local |
| Esqueci senha | `/esqueci-minha-senha` | `ui01-forgot-password-desktop.png` | Runtime local |
| Confirme e-mail | `/confirme-seu-email` | `ui01-confirm-email-desktop.png` | Runtime local |
| E-mail verificado | `/email-verificado` | `ui01-email-verified-pending-desktop.png` | Runtime local (estado pendente sem query) |
| Redefinir senha | `/redefinir-senha` | — | **Código** (`reset-password-form` + `AuthShell`) |
| Feed encontrar | `/encontrar` | — | **Código**; runtime redirecionou para `/login?next=/encontrar` (sem sessão) |
| Detalhe pedido | `/encontrar/[id]` | — | **Código** |
| Intercessão | `/encontrar/[id]/orar` | — | **Código** |
| Criar pedido | `/pedir` | — | **Código** (inclui estado `!canPublish`) |
| Acompanhamento oração | `/oracoes/[id]` | — | **Código** |
| Conta | `/account` | — | **Código** |
| Admin revisão | `/admin/revisao` | — | **Código** |

Preview funcional disponível:  
`https://oraora-git-hardening-gate-2-6d-account-b52bb2-alefeios-projects.vercel.app`  
(proteção SSO Vercel impede captura automatizada sem login do proprietário).

---

## 2. Inventário de componentes visuais

| Componente | Arquivo | Observação visual |
|---|---|---|
| `BrandLogo` | `src/components/brand/logo.tsx` | Usa `public/logo.png`; tamanhos sm/md/lg |
| `SiteHeader` | `src/components/layout/site-header.tsx` | `border-b` + surface; nav pública vs app |
| `SiteFooter` | `src/components/layout/site-footer.tsx` | Marca + essência + disclaimer de desenvolvimento |
| `AuthShell` | `src/components/auth/auth-shell.tsx` | Logo central + Card; max-w-md |
| `Button` / `ButtonLink` | `src/components/ui/button.tsx` | primary/secondary/ghost/danger; min-h-11 |
| `Card` / `EmptyState` | `src/components/ui/card.tsx` | Borda + sombra suave; empty dashed |
| `Badge` | `src/components/ui/badge.tsx` | tones info/success/warning/danger/sage |
| `Field` + inputs | `src/components/ui/field.tsx` | Label/hint/error; FormError/Success |
| Forms auth | `login-form`, `signup-form`, `forgot-password-form`, `reset-password-form` | Padrão AuthShell |
| Forms oração | `create-request-form`, `prayer-compose-form` | Campos + estados pending/error |
| Admin actions | `admin-validation-actions.tsx` | Controles operacionais |
| Tokens CSS | `src/app/globals.css` | Paleta + hero gradients |
| Institutional page | `release/.../src/app/page.tsx` | Landing sem forms |

---

## 3. Diagnóstico da identidade aplicada

### Pontos fortes

1. Paleta oficial e tipografia (Nunito/Inter) já estão no código.
2. Logo oficial presente no hero e no auth.
3. Princípio de reciprocidade aparece de forma consistente na home e no signup.
4. Tokens semânticos existem (`text-*`, `success/danger`, focus-visible).
5. Auth tem padrão único (`AuthShell`) — boa base de consistência.

### Lacunas

1. **Acentos de marca subutilizados** fora do logo: interface é majoritariamente roxo + cream + cards brancos; gold/coral/sage pouco aplicados como superfície (exceto label «Essência» em coral).
2. **Hierarquia hero redundante:** logo já contém a assinatura; H1 repete «Pessoas que oram…» (home funcional e institucional).
3. **Linguagem de card genérica:** quase toda superfície de conteúdo usa o mesmo `Card` com borda + sombra — risco de aparência de template/admin.
4. **Dois “produtos” visuais:** PROD-0 institucional (composição editorial, sem nav/CTAs de produto) vs home funcional (nav + CTAs + 3 cards). Ainda não há sistema unificado.
5. **Iconografia do MiniGuia** (infinito, figuras, mãos, coração) **não está no produto** — só o logo raster.

---

## 4. Auditoria por tela (evidência)

### Homepage pública — capturada

**Evidência:** `ui01-homepage-desktop.png`, `ui01-homepage-mobile.png`

| Critério | Achado |
|---|---|
| Composição | Hero centralizado generoso; abaixo grade de 3 cards; seção Essência em superfície branca |
| Hierarquia | Logo + H1 competem; CTAs claros |
| Legibilidade | Corpo em `text-secondary` OK; label coral «Essência» com contraste insuficiente (ver §6) |
| Marca | Gradientes hero presentes; ainda “template SaaS espiritual” |
| Responsivo | Em mobile, link «Encontrar» some (`hidden sm:inline`); cards empilham; CTAs wrap |
| Densidade | Boa no hero; cards repetitivos |

### Auth (login / signup / recuperação / verificação) — capturadas

**Evidência:** `ui01-login-desktop.png`, `ui01-signup-desktop.png`, `ui01-forgot-password-desktop.png`, `ui01-confirm-email-desktop.png`, `ui01-email-verified-pending-desktop.png`

| Critério | Achado |
|---|---|
| Composição | Coluna estreita centrada; muito vazio em desktop largo |
| Hierarquia | Logo > título > card; boa para foco de tarefa |
| Legibilidade | Hints `text-muted` no limiar AA; botão disabled lavado (`primary-disabled`) |
| Consistência | Alta entre telas AuthShell |
| Estados | Confirm e-mail: botão reenviar disabled sem e-mail; email-verificado: estado pendente claro |
| Riscos | Aparência genérica de “auth kit”; pouca atmosfera contemplativa além do cream |

### Feed / detalhe / orar / pedir / conta / admin — código (sem captura autenticada)

Evidências de código: `encontrar/page.tsx`, `[id]/page.tsx`, `orar/page.tsx`, `pedir/page.tsx`, `account/page.tsx`, `admin/revisao/page.tsx`, `oracoes/[id]/page.tsx`.

Achados recorrentes:

1. Layout `max-w-2xl|3xl` + header/footer — padrão de leitura bom, mas visualmente monótono.
2. Feed: chips `rounded-full` + lista de Cards — risco de “dashboard de conteúdo”.
3. Detalhe: história solta + Card só na intenção — hierarquia ok; CTA full-width forte.
4. Pedir bloqueado (`!canPublish`): texto normativo de elegibilidade — **preservar**; só refinar apresentação.
5. Status de oração: banners soft success/warning — bons; badge com outcome cru (`pending`) parece técnico.
6. Conta: dl simples em Card — funcional, sem personalidade.
7. Admin: priorizar legibilidade operacional; não “embelezar” ao custo de densidade.

### Landing institucional — capturada (PROD-0)

**Evidência:** `prod0-desktop-hero.png`, `prod0-mobile-hero.png`

| Critério | Achado |
|---|---|
| Composição | Editorial, sem cards no hero; mais alinhada a “serenidade” |
| Hierarquia | Marca forte; H1 = assinatura (redundância com logo) |
| Consistência | Tokens e fontes alinhados, mas **não compartilha** header/footer/componentes do app |
| Responsivo | Coluna única ok; mobile esparso |

---

## 5. Responsividade

| Achado | Evidência | Severidade |
|---|---|---|
| Nav pública: «Encontrar» oculto em `<sm` | `site-header.tsx` + captura mobile | Média (descoberta reduzida; rota permanece) |
| Auth: card estreito deixa laterais vazias no desktop | capturas auth | Baixa (aceitável; pode ambientar) |
| Chips de categoria: scroll horizontal | `encontrar/page.tsx` | Baixa (padrão ok) |
| CTAs hero: wrap em mobile | captura mobile | Baixa |
| Skeletons: texto «Carregando…» sem estrutura visual | feed/pedir/account | Média (estado de carga pobre) |
| Institutional vs app: breakpoints/padrões divergentes | duas branches | Alta (sistema único necessário no UI-03) |

---

## 6. Acessibilidade visual (contraste WCAG 2.2)

Cálculo relativo luminance (texto normal AA ≥ 4,5; grande ≥ 3,0):

| Par | Ratio | Resultado |
|---|---:|---|
| `#2A2140` on `#FCF7EE` | 14,16 | AA PASS |
| `#5B5270` on `#FCF7EE` | 6,82 | AA PASS |
| `#7A718C` on `#FCF7EE` | **4,31** | **AA LARGE ONLY** (falha texto normal) |
| `#533E7E` on `#FCF7EE` | 8,34 | AA PASS |
| `#FCF7EE` on `#533E7E` | 8,34 | AA PASS |
| `#E78976` on `#FCF7EE` | **2,39** | **FAIL** (usado como label «Essência») |
| `#F4B25C` on `#FCF7EE` | **1,73** | **FAIL** (não usar como texto) |
| `#8FAE9A` on `#FCF7EE` | **2,26** | **FAIL** (não usar como texto) |
| Status soft (danger/success/warning) | ≥5,0 | AA PASS |

Outros:

- `:focus-visible` global presente — bom.
- Alvos de toque `min-h-11` nos botões — bom.
- Empty/loading sem landmark visual estruturado.
- Badge/outcome técnico pode ser pouco amigável a leitores de tela se não houver texto legível adicional (já há banners — manter).

---

## 7. Consistência de componentes

| Tema | Diagnóstico |
|---|---|
| Botões | Variantes claras; `rounded-md` uniforme; primary dominante |
| Cards | Um único estilo para quase tudo → fadiga visual |
| Campos | Borda fraca; focus só por outline global — ok, mas pouco “marca” |
| Badges | Úteis; tom `sage` mapeado para success-soft (semântica fraca) |
| Tipografia | Display só em h1–h3; peso/tracking pouco diferenciados entre seções |
| Sombras | Uma sombra genérica; pouco caráter |
| Nav | Ghost + primary misturados; app mode sem destaque de rota ativa |

---

## 8. Problemas de hierarquia e legibilidade (priorizados)

1. **P1 — Contraste:** `text-muted` e coral-como-texto falham AA em usos reais.
2. **P1 — Redundância marca/H1** na home e institucional.
3. **P1 — Dois sistemas visuais** (PROD-0 vs app) sem Design System compartilhado.
4. **P2 — Excesso de cards** iguais (home, feed, forms, conta).
5. **P2 — Estados de carga/vazio pobres** (texto único).
6. **P2 — Mobile: sumiço de «Encontrar»** no header público.
7. **P3 — Auth desktop “flutuando”** sem ambientação contemplativa.
8. **P3 — Badges com outcomes crus** (`pending`, `manual_review`) na UI de usuário.

---

## 9. Oportunidades de refinamento (sem mudar regras)

1. Unificar tokens e tipografia em Design System único para institucional + app.
2. Reduzir cards: usar superfícies, divisores e ritmo tipográfico.
3. Aplicar gold/coral/sage como **superfície/ênfase**, nunca como texto pequeno.
4. Hierarquia de marca: logo hero; H1 pode enfatizar essência/princípio sem repetir a tagline do arquivo.
5. Ambientação serena (textura/gradiente sutil) em auth e área logada — sem poluição.
6. Skeletons e empty states com composição de marca.
7. Indicador de rota ativa na nav do app (só visual).
8. Manter textos de elegibilidade/reciprocidade; apenas tipografia e layout.

---

## 10. Matriz preliminar de regressão (para UI-05/06)

| Área | Preservar (funcional) | Pode mudar (visual) |
|---|---|---|
| Rotas | Paths e redirects | Layout interno |
| Auth | Campos, validações, mensagens normativas | Shell, espaçamento, superfície |
| Reciprocidade | `canPublish`, consumo de elegibilidade | Apresentação do bloqueio |
| Feed | Ordenação/filtros por categoria | Card/lista/chips |
| Intercessão | Campos, scripture opcional, idempotency | Tipografia do formulário |
| Admin | Ações de validação | Densidade/estilo operacional |
| APIs/DB | Contratos e schema | Nenhum |

---

## Conclusão UI-01 (auditoria)

A base de marca está correta e já há tokens úteis, mas a aplicação atual ainda parece **MVP funcional com skin de marca**, não uma experiência contemplativa própria. O redesign pode (e deve) mudar a aparência profundamente **sem tocar nas regras**.

### Atualização UI-02

- Direção A+B **aprovada para exploração**.
- Inventário captura vs código **corrigido** em [ui-02-pendencias-captura.md](./ui-02-pendencias-captura.md).
- Documento V1.0 **incluído** em [references/](./references/).
