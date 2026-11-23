# UI-05B regression matrix

| Check | Result | Notes |
|---|---|---|
| Header 390 single nav row | PASS | Encontrar/Entrar/Criar conta top=62; logo top=13 |
| Overflow home 390 | PASS | scrollWidth <= clientWidth |
| Login AuthShell continuous | PASS | local :3055 |
| AUTH_PATHS.postLogin | PASS | /encontrar unit tests |
| AUTH_PATHS.account preserved | PASS | /account |
| Open redirect safety | PASS | auth-callback tests |
| DB tests | SKIPPED | not PASS |
| trustedOrigins / PR #3 | NOT MERGED | separate |
| Login → /encontrar real session | PENDING OWNER | Preview SSO |
