# Autenticação e e-mail — Ora Ora

## Biblioteca

Better Auth + adapter Prisma (`@better-auth/prisma-adapter`).

## Status Gate 2.6A

| Item | Classificação |
|---|---|
| Código: `RESEND_FROM` como contrato oficial | **Configurado** |
| Código: fallback `AUTH_EMAIL_FROM` | **Configurado** (só se `RESEND_FROM` ausente) |
| Código: rejeição de remetente Gmail | **Configurado** |
| Código: cadastro público fechado sem Resend válido | **Configurado** |
| `BETTER_AUTH_SECRET` no Preview | **Presente** |
| `AUTH_EMAIL_MODE=resend` no Preview | **Presente** |
| `RESEND_API_KEY` / `RESEND_FROM` no Preview | **Ausentes** (só Production na última auditoria) |
| Domínio `oraora.ia.br` verificado no Resend | **Não comprovado** nesta sessão |
| Remetente definitivo | `Ora Ora <contato@oraora.ia.br>` (após DNS/verificação) |
| Cadastro público funcional no Preview | **Bloqueado** até Resend válido no Preview + domínio |

## Precedência do remetente

1. `RESEND_FROM` — variável principal.
2. `AUTH_EMAIL_FROM` — fallback legado de compatibilidade.

Evite definir as duas com valores diferentes. Prefira apenas `RESEND_FROM`.

Remetentes de caixa pessoal (`@gmail.com`, `@googlemail.com`) são rejeitados.

## Variáveis (nomes apenas)

| Variável | Escopo necessário p/ Preview | Notas |
|---|---|---|
| `BETTER_AUTH_SECRET` | Preview | Já presente |
| `AUTH_EMAIL_MODE=resend` | Preview | Já presente |
| `RESEND_API_KEY` | **Preview** (e Production se desejado) | Hoje: Production apenas |
| `RESEND_FROM` | **Preview** | Valor alvo: `Ora Ora <contato@oraora.ia.br>` |
| `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` | Preview | Recomendadas (HTTPS canônico) |
| `AUTH_EMAIL_FROM` | Opcional | Só fallback; preferir remover após migração |

## Ajuste de escopo (ação do proprietário — sem auto-cópia)

Não copiar automaticamente Production → Preview.

No painel Vercel (`alefeios-projects/oraora` → Settings → Environment Variables):

1. Adicionar/duplicar **para Preview** (ou “Preview + Production” se quiser o mesmo valor):
   - `RESEND_API_KEY`
   - `RESEND_FROM=Ora Ora <contato@oraora.ia.br>`
2. Confirmar no Resend que o domínio `oraora.ia.br` está **Verified** (não só DNS propagado).
3. Remover qualquer remetente Gmail das variáveis.
4. Redeploy do Preview após salvar.

## Domínio de envio

- **Não usar** `oraoraads@gmail.com` (ou qualquer Gmail) como `from` da API Resend.
- Definitivo: `Ora Ora <contato@oraora.ia.br>`.
- Propagação DNS ≠ verificação concluída no painel Resend.

## Declaração

Autenticação hospedada **não** está pronta para homologação funcional real enquanto Preview não tiver `RESEND_API_KEY` + `RESEND_FROM` válidos e domínio verificado.

## Gate 2.6D — recuperação e verificação (UI)

Rotas internas (sempre relativas ao host do ambiente; não hardcodar URL de deployment):

| Rota | Função |
|---|---|
| `/login` | Login + link **Esqueci minha senha** |
| `/esqueci-minha-senha` | `authClient.requestPasswordReset` (ack neutro) |
| `/redefinir-senha` | `authClient.resetPassword` (token na query) |
| `/confirme-seu-email` | Pós-cadastro + reenvio controlado |
| `/email-verificado` | Callback de verificação (`callbackURL`) |

Callbacks só aceitam caminhos relativos internos (`src/lib/auth/safe-callback.ts`).  
`revokeSessionsOnPasswordReset` permanece ativo no Better Auth.  
Páginas `(auth)` usam `robots: noindex` e `referrer: no-referrer`.
