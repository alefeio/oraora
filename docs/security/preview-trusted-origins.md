# Preview — Better Auth `trustedOrigins`

## Causa (comprovada por análise + testes)

No Vercel Preview existem **dois hosts distintos**:

1. `VERCEL_URL` — URL do deployment (hash)
2. Alias git da branch — ex. `oraora-git-hardening-gate-2-6d-account-b52bb2-alefeios-projects.vercel.app`

O navegador envia `Origin` com o **alias**. A implementação anterior só confiava em `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL` e `VERCEL_URL`. Se `BETTER_AUTH_URL` apontava para Production/outro host, o alias era rejeitado → **`Invalid origin`**.

Better Auth valida `Origin` em mutações com cookie (`origin-check`).

## Correção

- `src/lib/auth/trusted-origins.ts`
- Preview: `getAuthBaseURL` prioriza `VERCEL_BRANCH_URL` → `VERCEL_URL` (links de e-mail no mesmo ambiente)
- `resolveTrustedOrigins` inclui branch URL + wildcard **somente do projeto**  
  `https://oraora-*-alefeios-projects.vercel.app`
- Production: sem wildcard; URLs explícitas apenas
- Callbacks de UI continuam **caminhos relativos** (`safe-callback`) — sem open redirect

## Testes

`tests/auth-trusted-origins.test.ts`
