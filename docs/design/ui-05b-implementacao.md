# UI-05B — Autenticação visual + destino pós-login

Branch: `feature/ui-05b-auth-visual`  
Base: `security/sec-03a-vercel-functions` @ `88d289df4434d8172b695ab10b1caf7181c2a6f7`  
Ancestrais: UI-05A (`a449e32`) + SEC-01 (`d29143d`) + SEC-03a  
Referência visual: `design/ui-redesign-discovery` @ `1420b24e5ee80e0a5a56abfb3d96e011459c8345` (sem merge)

## Escopo aplicado

| Superfície | Status |
|---|---|
| Cabeçalho mobile | Composição em duas faixas no mobile (`logo` + nav `justify-between`); uma linha no `sm+`; destinos preservados |
| AuthShell contínuo | Logo + título + formulário no mesmo painel; tipografia Nunito/Inter; campos/botões AA |
| `/login` `/signup` `/esqueci-minha-senha` `/redefinir-senha` `/confirme-seu-email` `/email-verificado` | Visual alinhado ao UI-04R |
| Destino pós-login | `AUTH_PATHS.postLogin = "/encontrar"`; `AUTH_PATHS.account` preservado |

## Alteração funcional autorizada (única)

Login bem-sucedido: `/login` → `/encontrar` (antes `/account`).  
`LoginForm`: `callbackURL` e `router.push` usam `AUTH_PATHS.postLogin`.

### `proxy.ts` e parâmetro `next`

O proxy continua anexando `?next=<pathname>` ao redirecionar usuário não autenticado para `/login`.  
O `LoginForm` **não** consome `next` nesta sprint — o destino padrão é sempre `postLogin`.  
Não foi introduzida nova política de retorno por `next`. Callbacks externos continuam bloqueados por `safe-callback`.

## Preservado

Campos, minLength, verificação de e-mail, recuperação de senha, anti-enumeração, tokens, sessões, rate limiting, open-redirect guards, Better Auth, `trustedOrigins`, regras de reciprocidade/intercessão/admin, rotas de pedidos.  
PR #3 (`Invalid origin`) **não** incorporado.  
PRs #4 e #5 **não** mergeados automaticamente.

## Validação automatizada

| Check | Resultado |
|---|---|
| `next` | 16.4.6 |
| `eslint-config-next` | 16.4.6 |
| `@vercel/functions` | 3.10.6 |
| `attachDatabasePool` | preservado (teste unitário) |
| Lint | PASS |
| Typecheck | PASS (após `prisma generate`) |
| Build | PASS (sem regressão Cache Components / PPR) |
| Unitários | 56+ PASS incl. destino `postLogin` |
| DB tests | NÃO EXECUTADOS (skipped; não registrar como PASS) |

Responsividade local: `node scripts/check-ui-05b-auth-responsive.mjs` (app em `:3000`).

## Evidências Preview

Pasta: `docs/design/evidence/ui-05b/`  
Inclui header mobile, auth desktop/mobile, recuperação/confirmação, audit JSON.

## Testes manuais pendentes do proprietário

1. Login real com credenciais válidas no Preview → confirmar URL `/encontrar`.
2. Senha inválida → permanece em `/login` com erro.
3. E-mail não verificado → bloqueio atual.
4. `/account` acessível via menu Conta após autenticado.
5. Logout e recuperação de senha.
6. Se alias Preview falhar por `trustedOrigins` / Invalid origin: usar origem confiável explícita; **não** desabilitar proteção; integrar PR #3 separadamente.

## Homologação do destino pós-login

Só é definitiva após sessão autenticada real no Preview confirmando `/encontrar`.
