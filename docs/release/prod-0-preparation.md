# PROD-0 — Preparação do primeiro release (Gate 2.6D)

Atualizado após Gate 2.6D (auth recovery UI). **Production permanece intocada.**

## Branches

| Ref | SHA / estado | Nota |
|---|---|---|
| `main` | `cf4ee681` (baseline citada) | Sem merge deste gate |
| `hardening/gate-2-6a-resend-auth` | fundação auth/Resend + pooled retry | Base histórica 2.6C |
| `hardening/gate-2-6d-account-recovery` | recuperação de senha + UX verificação | Em homologação |

Dependências funcionais já na linha de desenvolvimento: Prisma 7, Better Auth, pedidos/orações/reciprocidade (Sprints 1–2), branding 2.2, isolamento Preview DB 2.4–2.5, Resend 2.6A–C.

## Qualidade

| Item | Status |
|---|---|
| Build de release (local) | Executar em cada push da branch 2.6D |
| Testes unitários auth/callback/password | Presentes |
| Testes DB (`RUN_DB_TESTS=1`) | Podem estar indisponíveis localmente (documentar skip ≠ PASS) |
| Segurança: verificação obrigatória hospedada | Sim |
| Segurança: reset com revogação de sessão | Sim (`revokeSessionsOnPasswordReset`) |
| Segurança: callbacks relativos | Sim |
| Homologação login com senha do proprietário | **Pendente Gate F** |
| Jornadas oração/reciprocidade em Preview | Não homologadas de ponta a ponta neste gate |

## Production (metadados — sem alterações)

| Item | Observação |
|---|---|
| Banco | `prisma-postgres-oraora` (`store_sVF0L5GhFshjZfVP`) exclusivo Production |
| Preview DB | `oraora-preview` (`store_xYaw5J0xe3Gb9T89`) exclusivo Preview |
| Migrations Production | **Não executar**; plano: aplicar as 4 migrations já usadas no Preview, após backup/janela |
| `BETTER_AUTH_SECRET` | Deve ser exclusivo de Production (não reutilizar Preview) |
| Resend | Domínio `oraora.ia.br` verificado; `RESEND_FROM` definitivo |
| URLs canônicas | Definir `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` = domínio oficial antes do go-live |
| Cookies | HTTPS + `sameSite=lax` + `httpOnly` |
| Domínio `oraora.ia.br` | Não alterar apontamentos neste gate |
| Features inacabadas | Manter cadastro/operações atrás de verificação e feature flags até homologação |

### Plano de migrations (não executar)

1. Confirmar backup / snapshot do store Production.  
2. Apontar `DIRECT_URL`/`DATABASE_URL` **somente** Production em sessão controlada.  
3. `prisma migrate deploy` das 4 migrations da linha atual.  
4. Smoke: `/api/v1/health` com `database=ok`, login admin interno se existir.  
5. Rollback: restaurar snapshot (sem `db push`).

## Estratégia de publicação

### A — Página institucional no domínio oficial
Sem cadastro/orações públicas até homologação completa.  
**Prós:** risco baixo, domínio “vivo”. **Contras:** MVP incompleto.

### B — MVP completo após homologação de oração/reciprocidade
Inclui auth E2E (2.6D) + jornadas de oração.  
**Prós:** valor de produto. **Contras:** mais esforço e risco operacional.

**Recomendação: A**, depois promover B. Justificativa: auth acabou de ganhar recovery UI; login real do proprietário e jornadas de oração ainda não fecharam homologação; Production teve deploys Error históricos e migrations pendentes.

## PR draft

Preparar PR **draft** `hardening/gate-2-6d-account-recovery` → `main` **somente** quando o Gate F (login real) passar e a estratégia A/B estiver escolhida. Sem merge automático.

## Não autorizado neste documento

- Merge na `main`  
- Deploy/promote Production  
- Migrations/seeds em Production  
- Sprint 3 financeira  
