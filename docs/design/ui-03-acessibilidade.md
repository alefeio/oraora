# UI-03 — Acessibilidade visual (WCAG 2.2 AA)

Nível mínimo: **WCAG 2.2 AA**.  
Fonte de cálculo: `evidence/ui-03/contrast-audit.csv`.

## Correção UI-02

| Problema | Correção |
|---|---|
| Rótulo «PRINCÍPIO» em `--brand-coral` (2,39:1) | Texto `--label-emphasis` / primary; coral só como **dot** decorativo |
| Muted produto `#7A718C` (4,31 em cream) | Token DS `--text-muted: #534A66` (7,75:1) |
| Disabled cream-on-`#A89BBD` (2,43:1) | Preferir bg `#D9D2E4` + texto primary; manter `disabled`/`aria-disabled` |

## Resultados da auditoria de combinações

### Texto — PASS

Todos os pares semânticos de texto sobre cream, white, soft, coral-soft, gold-soft, sage-soft e on-primary (purple) **passam AA** (≥4,5:1).

### Proibidos (confirmados FAIL)

Gold, coral e sage como texto sobre cream — **não usar**.

### Disabled

Padrão antigo falha AA. Padrão recomendado do DS passa. Controles disabled também devem permanecer não-acionáveis por teclado/pointer.

### Bordas

`border` / `border-strong` < 3:1 sobre cream. Classificadas como **decorativas**. Significado de UI vem de texto, foco e botões (≥3:1). Inputs usam `border-strong` + label + focus ring.

## Regras operacionais

1. Status nunca só por cor — banners com texto.
2. Focus-visible global 2px primary + offset 2.
3. Alvos de toque ≥44px (meta 48px em CTAs principais).
4. Ampliação / reflow 320px sem perda de informação (validar em UI-06).
5. Navegação por teclado e leitores de tela: **não comprovados** pelas demos estáticas — ficam para UI-06.
6. Não alterar textos normativos de erro/elegibilidade; apenas tipografia/superfície.

## Escopo das demos

Style tiles e o showcase do DS demonstram **aparência e contraste de tokens**.  
Não comprovam funcionamento, teclado ou usabilidade testada.
