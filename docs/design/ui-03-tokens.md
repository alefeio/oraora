# UI-03 — Tokens do Design System (60% AB-1 / 40% AB-2)

Paleta oficial **inalterada**. Tokens semânticos definem usos seguros.

## 1. Brand (oficiais — não mudar HEX)

| Token | HEX | Uso permitido | Uso proibido |
|---|---|---|---|
| `--brand-primary` | `#533E7E` | CTAs, títulos, links, foco, labels | — |
| `--brand-gold` | `#F4B25C` | Underline, glow, 1 acento/viewport | Texto |
| `--brand-coral` | `#E78976` | Dot/acento, superfície soft | Texto |
| `--brand-sage` | `#8FAE9A` | Apoio/sucesso visual de superfície | Texto |
| `--brand-cream` | `#FCF7EE` | Fundo de página | Texto sobre si sem contraste |

## 2. Texto (semânticos AA)

| Token | HEX | Sobre cream | Sobre white | Sobre soft |
|---|---|---:|---:|---:|
| `--text-primary` | `#2A2140` | 14,16 ✅ | 15,11 ✅ | ≥13 ✅ |
| `--text-secondary` | `#5B5270` | 6,82 ✅ | 7,28 ✅ | ≥6,4 ✅ |
| `--text-muted` | `#534A66` | 7,75 ✅ | 8,27 ✅ | ≥7,3 ✅ |
| `--text-on-primary` | `#FCF7EE` | — | — | 8,34 ✅ em `#533E7E` |
| `--label-emphasis` | `#533E7E` | 8,34 ✅ | 8,91 ✅ | ≥7,6 ✅ |

> Substitui o muted de produto `#7A718C` (4,31 — falhava AA em cream).

## 3. Superfícies

| Token | HEX | Papel |
|---|---|---|
| `--surface` | `#FFFFFF` | Cards/forms quando necessários |
| `--surface-soft` | `#F6F0E6` | Painéis AB-1, apoio |
| `--surface-coral-soft` | `#F8EBE7` | Ênfase acolhedora sem texto coral |
| `--surface-gold-soft` | `#FBF1DF` | Luz/esperança |
| `--surface-sage-soft` | `#EAF1EC` | Paz/apoio |
| `--background` | `brand-cream` | Canvas |

## 4. Ação e estados

| Token | HEX | Notas |
|---|---|---|
| `--primary` | brand-primary | Default CTA |
| `--primary-hover` | `#433166` | |
| `--primary-active` | `#362652` | |
| `--primary-disabled-bg` | `#D9D2E4` | **Novo padrão** — texto `--text-primary` (~10:1). Evitar cream em `#A89BBD` |
| `--success` / `--success-soft` | `#3F6F55` / `#E7F2EB` | 5,06 ✅ |
| `--danger` / `--danger-soft` | `#9B3B32` / `#FDECEB` | 5,99 ✅ |
| `--warning` / `--warning-soft` | `#8A5A12` / `#FFF3DD` | 5,38 ✅ |
| `--focus-ring` | `#533E7E` | 2px + offset 2 |

## 5. Forma (AB mix)

| Token | AB-1 (60%) | AB-2 (40%) | Uso |
|---|---|---|---|
| `--radius-sm` | 0.5rem | 0.3rem | chips pequenos / editorial |
| `--radius-md` | 0.85rem | 0.35rem | botões/campos |
| `--radius-lg` | 1rem | 0.45rem | cards/painéis |
| `--shadow-soft` | `0 14px 36px rgba(42,33,64,.06)` | `none` | AB-1 listagens; AB-2 sem sombra |
| `--border` | `#E4D9C8` | hairline | Decorativo (não carrega significado sozinho) |
| `--border-strong` | `#CBBBA3` | inputs | Controles |

## 6. Tipografia

| Papel | Família | Pesos | Escala desktop | Mobile |
|---|---|---|---|---|
| Display | Nunito | 700–800 | clamp(2rem, 4vw, 3rem) | clamp(1.75rem, 6vw, 2.25rem) |
| Title | Nunito | 700 | 1.35–1.75rem | 1.25–1.5rem |
| Body | Inter | 400–500 | 1–1.05rem / lh 1.55–1.7 | 1rem |
| Meta/label | Inter | 600 | 0.75–0.9rem | 0.75–0.85rem |
| Kicker | Inter | 600 | 0.75rem uppercase tracking | primary, nunca coral |

Line-length leitura: **60–72ch**. Containers: marketing `max-w-6xl`; app leitura `max-w-2xl|3xl`; auth `max-w-md|lg`.

## 7. Espaço

Escala **4/8**: 4, 8, 12, 16, 24, 32, 48, 64.  
Gutters: mobile 16–20; desktop 24–32.  
Seção vertical AB-2: +8–16px vs AB-1.

## 8. Motion

Apenas hover/focus/opacity curtos (≤180ms). Sem animações que distraiam a oração. Respeitar `prefers-reduced-motion`.
