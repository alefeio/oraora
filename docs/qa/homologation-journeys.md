# Roteiro de homologação — jornadas Ora Ora

Documento operacional complementar a `docs/architecture/preview-homologation.md`.

## Pré-requisitos remotos

| Pré-requisito | Status Gate 2.4 |
|---|---|
| Banco Preview ≠ Production | **Não comprovado** |
| Auth + Resend no Vercel | **Pendente do proprietário** |
| `migrate deploy` Preview | **Bloqueado** — sem autorização |
| Seed sintético remoto | **Bloqueado** |

## Usuários sintéticos (não criar remotamente neste gate)

- `homo.intercessor@example.test` — USER
- `homo.pedinte@example.test` — USER
- `homo.admin@example.test` — ADMIN
- `homo.outsider@example.test` — USER (negativos)

Pedidos/orações: textos genéricos (“pedido de teste de homologação”), **sem** inventar sofrimento real.

## Jornada 1 — Autenticação

Cadastro → e-mail Resend → verificar → login → logout → reset de senha.  
Negativo: ambiente sem Resend mantém signup fechado.

## Jornada 2 — Descoberta

Login → `/encontrar` → categorias → card → detalhe → privacidade (`publicLabel`, sem vazar `authorId`).

## Jornada 3 — Intercessão

Orar → pendente → impedir auto-oração → acompanhar `/oracoes/[id]`.

## Jornada 4 — Reciprocidade

Pendente não libera `/pedir` → aprovação libera uma vez → publicar consome → novo pedido exige nova oração → sem acúmulo.

## Jornada 5 — Administração

Admin ativo em `/admin/revisao` → comum/banido negados → invalidação com auditoria.

## Jornada 6 — Consistência

Idempotência; contagens; corrida approve/reject; sem duplicar direitos.

## Cobertura local já existente

`RUN_DB_TESTS=1 npm test` — reciprocidade, invalidação, authz HTTP, pedidos, e-mail adapter, guards.

## Resultado Gate 2.4

Roteiro **preparado**. Execução remota **não iniciada**.
