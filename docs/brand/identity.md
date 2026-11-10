# Identidade visual — Ora Ora

## 1. Nome oficial

**Ora Ora**

## 2. Conceito do símbolo

A logomarca une os dois “O” de Ora Ora em um infinito. O infinito remete a Deus e eternidade, oração contínua, reciprocidade, conexão entre pessoas e amor ao próximo. Formas arredondadas e acolhedoras sustentam a linguagem contemporânea da marca.

## 3. Assinatura

**Pessoas que oram umas pelas outras.**

## 4. Princípio de reciprocidade

**Antes de pedir uma oração, ore por alguém.**

Essência: **A fé aproxima pessoas. O cuidado se transforma em solidariedade.**

## 5. Paleta

| Token | Uso | HEX |
|---|---|---|
| `brand-primary` | Cor principal da interface | `#533E7E` |
| `brand-gold` | Destaque / energia | `#F4B25C` |
| `brand-coral` | Acolhimento / ênfase | `#E78976` |
| `brand-sage` | Serenidade / apoio | `#8FAE9A` |
| `brand-cream` | Superfície de fundo | `#FCF7EE` |

## 6. Tokens funcionais

Definidos em `src/app/globals.css`:

- texto: `--text-primary`, `--text-secondary`, `--text-muted`, `--text-on-primary`
- ações: `--primary`, `--primary-hover`, `--primary-active`, `--primary-disabled`
- estados: `--success`, `--warning`, `--danger` (+ variantes soft)
- superfície: `--surface`, `--surface-muted`, `--border`, `--focus-ring`

Não espalhar HEX diretamente nos componentes.

## 7. Tipografia

- Títulos / display: **Nunito** (`--font-display`)
- Interface / corpo: **Inter** (`--font-body`)
- Logomarca: preservar o desenho tipográfico do arquivo original

## 8. Uso do logotipo

- Arquivo oficial: `public/logo.png`
- Componente: `src/components/brand/logo.tsx`
- Ícone / favicon da aplicação: metadata aponta para `/logo.png`
- Não redesenhar com CSS, emojis ou ícones
- Não alterar cores, proporções ou transparência
- Em cabeçalhos compactos, usar o arquivo completo com altura reduzida (não há símbolo isolado separado nesta sprint)

## 9. Acessibilidade

- Contrastres de texto seguem tokens escuros sobre cream/branco
- Dourado, coral e sage não são usados como texto pequeno sobre cream
- Status também usa rótulos textuais / badges, não só cor
- Foco visível global via `:focus-visible`
- Alvos de toque com altura mínima ~44px nos botões

## 10. Tom de voz

Acolhedor, claro, respeitoso e sem competitividade espiritual. Evitar linguagem de pontos, ranking ou “saldo de orações”. Não prometer dinheiro, doações ou saques enquanto o domínio financeiro não existir.

## 11. Aplicação em páginas

- Homepage: marca hero + princípio + caminho Conhecer → Orar → Pedir
- Auth: marca central + formulários simples
- Feed e jornada: cards legíveis, CTA de oração evidente
- Admin: marca presente sem prejudicar legibilidade operacional

## 12. Solidariedade financeira

A identidade visual pode antecipar acolhimento e solidariedade, mas a interface **não** deve apresentar créditos, carteira, Pix ou valores como se já funcionassem.

## Ativos

| Arquivo | Função |
|---|---|
| `public/logo.png` | Logomarca oficial transparente (completa) |
| `public/icon-square.png` | Recorte experimental do símbolo para ícone (derivado digital; não é vetor original) |
| `src/app/icon.png` / `src/app/apple-icon.png` | Favicon e ícone Apple gerados a partir do recorte |
| `docs/brand/identity.md` | Este guia |

Procedimento do derivado: recorte raster do símbolo a partir de `public/logo.png` (região aproximada do infinito), centralizado em canvas transparente e redimensionado. **Não** é vetor original. Se a auditoria visual exigir maior fidelidade, o proprietário deve fornecer um ativo quadrado oficial; `public/logo.png` permanece intacto.
