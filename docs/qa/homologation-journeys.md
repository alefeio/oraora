# Roteiro de homologação — jornadas Ora Ora

## Escopo

Jornadas já existentes (sem finanças). Executar primeiro em PostgreSQL local isolado.

Homologação remota (Preview) **bloqueada** até:

- isolamento físico Preview ≠ Production comprovado;
- `BETTER_AUTH_SECRET` + Resend configurados;
- autorização explícita para escrita remota.

## Jornada 1 — Cadastro

| Passo | Local | Preview |
|---|---|---|
| Criar conta | Sim (console email) | Bloqueado sem Resend |
| Confirmar e-mail | Manual via log local | Bloqueado |
| Sessão / logout | Sim | Bloqueado sem auth completa |
| Recuperar acesso | Hook local | Bloqueado sem e-mail real |

## Jornada 2 — Encontrar

Autenticar → categorias → listar → abrir pedido → anonimato/visibilidade.

Cobertura automatizada local: seeds + testes de privacy/feed + HTTP authz.

## Jornada 3 — Orar

Pedido elegível → escrever → enviar → estado → bloquear auto-oração.

Cobertura: `tests/*prayer*`, `idempotency*`, domínio de intercessão.

## Jornada 4 — Reciprocidade

Pendente não libera; aceite libera uma; publicação consome; sem acúmulo.

Cobertura: `tests/reciprocity-db.test.ts`, `invalidation-db.test.ts`.

## Jornada 5 — Administração

Admin ativo revisa; comum/banido não; invalidação auditável.

Cobertura: `tests/http-authz.test.ts`, `validation-concurrency-db.test.ts`.

## Resultado Sprint 2.3

- Local: jornadas 2–5 exercitadas pelos testes DB/HTTP existentes (36+ com novos unitários de e-mail).
- Preview: **bloqueio de homologação remota** — sem escritas e sem cadastro público funcional até auth+DB prontos.
