# UI-02 — Pendências de captura (inventário corrigido)

## Correção do inventário UI-01

O relatório UI-01 misturou “telas auditadas” sem separar com clareza **captura real** vs **somente código**.

### Contagem corrigida (estado atual)

| Método | Qtde | Telas |
|---:|---:|---|
| **Captura real (runtime)** | **8** | Home pública; Login; Signup; Esqueci senha; Confirme e-mail; E-mail verificado (pendente); Home mobile; Landing institucional (desktop+mobile = evidências PROD-0) |
| **Somente código** | **7** | Redefinir senha; Feed `/encontrar`; Detalhe pedido; Orar; Pedir (+ bloqueado); Conta; Admin revisão; Status `/oracoes/[id]`* |

\* Status de oração e detalhe/orar/pedir/conta/admin = área autenticada.

> Nota: a landing institucional conta como superfície distinta (branch PROD-0). Home pública funcional é outra superfície.

### Evidências já existentes (`evidence/ui-01/`)

- `ui01-homepage-desktop.png` / `ui01-homepage-mobile.png`
- `ui01-login-desktop.png` / `ui01-signup-desktop.png`
- `ui01-forgot-password-desktop.png`
- `ui01-confirm-email-desktop.png` / `ui01-email-verified-pending-desktop.png`
- `prod0-desktop-hero.png` / `prod0-mobile-hero.png`

---

## Checklist de capturas reais ainda necessárias

Solicitação ao proprietário: na sessão autenticada do Preview (SSO próprio), capturar e anexar em `docs/design/evidence/ui-02/owner-captures/` **sem enviar senha, cookies ou tokens**.

Preview funcional (protegido):  
`https://oraora-git-hardening-gate-2-6d-account-b52bb2-alefeios-projects.vercel.app`

**Não** desabilitar proteção SSO. **Não** inventar dados de usuários reais — fixtures de teste ok se já existirem no Preview.

| # | Tela | Rota | Estados a capturar | Desktop | Mobile | Status |
|---|---|---|---|---|---|---|
| 1 | Feed encontrar | `/encontrar` | lista com itens; vazio; filtro categoria ativo; skeleton/loading se visível | ☐ | ☐ | Pendente |
| 2 | Detalhe pedido | `/encontrar/[id]` | pedido legível + CTA orar | ☐ | ☐ | Pendente |
| 3 | Intercessão | `/encontrar/[id]/orar` | form vazio; erro de validação; pending submit | ☐ | ☐ | Pendente |
| 4 | Pedir — elegível | `/pedir` | formulário de criação | ☐ | ☐ | Pendente |
| 5 | Pedir — bloqueado | `/pedir` | mensagem de elegibilidade + CTA encontrar | ☐ | ☐ | Pendente |
| 6 | Status oração | `/oracoes/[id]` | pending/manual_review; accepted; rejected | ☐ | ☐ | Pendente |
| 7 | Conta | `/account` | dados de sessão + ações | ☐ | ☐ | Pendente |
| 8 | Admin revisão | `/admin/revisao` | lista pendente (se papel admin) | ☐ | ☐ | Pendente / N/A |
| 9 | Redefinir senha | `/redefinir-senha` | form; erro; sucesso | ☐ | ☐ | Pendente |

### Nomenclatura sugerida

`ui02-owner-<tela>-<estado>-<desktop|mobile>.png`

Ex.: `ui02-owner-pedir-bloqueado-mobile.png`

---

## Telas ainda não verificadas visualmente ao vivo

1. `/encontrar` (feed)  
2. `/encontrar/[id]`  
3. `/encontrar/[id]/orar`  
4. `/pedir` (elegível e bloqueado)  
5. `/oracoes/[id]` (estados)  
6. `/account`  
7. `/admin/revisao`  
8. `/redefinir-senha`

Essas telas **foram inventariadas e diagnosticadas por código** no UI-01; permanecem **unverified by screenshot** até o checklist acima.
