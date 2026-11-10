# Homologação Preview — Gate 2.4

## Classificação geral

| Item | Status |
|---|---|
| Build / Preview READY no commit base | **Verificado** (`48a3ae8`) |
| Isolamento físico Preview ≠ Production | **Não comprovado** (config compartilhada) |
| Auth Better Auth no Vercel | **Pendente do proprietário** |
| Resend / domínio verificado | **Pendente do proprietário** |
| Preflight remoto completo | **Bloqueado por segurança** |
| Migrations Preview | **Bloqueado** — `REMOTE MIGRATION AUTHORIZATION: NOT GRANTED` |
| Homologação HTTP remota | **Bloqueado** |
| Pronto para executar após autorização | **Parcial** (roteiro e plano prontos; pré-requisitos externos faltando) |

## Deployment de referência

- Branch de origem auditada: `hardening/sprint-2-3-preview-readiness`
- SHA: `48a3ae87a8e78091f3b3f201e03f759c318aed3a`
- Vercel status: Deployment completed / success
- Projeto: `alefeios-projects/oraora`

Preview READY **não** significa schema migrado, auth funcional ou isolamento de dados.

## Preflight (somente o que foi possível sem escrita)

### Verificado

- Commit do deployment corresponde ao HEAD aprovado da Sprint 2.3.
- Projeto Vercel correto (`oraora`).
- Variáveis de banco existem; runtime deve usar pooled na Vercel.
- Código local exige Resend na Vercel e fecha cadastro sem provedor.
- Postgres local `intercessao_dev` permanece o alvo de testes/escrita.

### Não comprovado / bloqueado

- Identidade inequívoca da instância Preview vs Production (`storeId`).
- Histórico `_prisma_migrations` no remoto (exigiria conexão ao alvo isolado).
- Ausência de dados pessoais no remoto.
- Conectividade read-only ao Preview **isolado** (ainda não existe configuração isolada comprovada).

### Conclusão do preflight

**Não iniciar migrations nem seeds.** Risco de alterar Production se as secrets compartilhadas apontam para a mesma instância.

## Plano de migrations Preview (após autorização + isolamento)

| Campo | Conteúdo |
|---|---|
| Banco de destino | Prisma Postgres **somente Preview** (novo), nunca Production |
| Migration inicial | `20261109180000_sprint_f_foundation` |
| Migration final | `20261110020000_sprint_2_1_hardening` (4 migrations no repo) |
| Procedimento | Com env Preview isolado: `npx prisma migrate deploy` (via `DIRECT_URL`/`DATABASE_URL` diretos do Preview). **Proibido** `db push`. |
| Pré-check | `vercel env ls` mostra secrets distintas Preview ≠ Production; health do deployment no SHA autorizado |
| Pós-check | Tabela `_prisma_migrations` com 4 entradas; `GET /api/v1/health`; smoke de schema sem seed sensível |
| Rollback | Novo database Preview pode ser descartado/recriado; Production intocada. Sem migrate “down” destrutivo em Production. |
| Riscos | Apontar migrate para secret compartilhada → schema change em Production; dados reais expostos no Preview |

## Roteiro de homologação (executável após auth + migrate)

Usuários sintéticos sugeridos (sem relatos de sofrimento real):

| Persona | Papel |
|---|---|
| `homo.intercessor@example.test` | USER — ora |
| `homo.pedinte@example.test` | USER — pede após orar |
| `homo.admin@example.test` | ADMIN — revisão |
| `homo.outsider@example.test` | USER — authz negativa |

### Autenticação

1. Cadastro com e-mail sintético → e-mail Resend recebido.
2. Verificar e-mail → login.
3. Logout / login.
4. Recuperação de senha (link só no e-mail, nunca em log).
5. Negativo: cadastro com auth incompleta deve falhar/bloquear.

### Descoberta

Categorias → feed → detalhe → rótulo anônimo / iniciais → sem `authorId` no cliente.

### Intercessão

Orar em pedido elegível → status pendente → bloquear auto-oração.

### Reciprocidade

Pendente não libera pedir → admin aprova → um direito → publicar consome → segundo pedido bloqueado → aprovação tardia não acumula.

### Administração

Admin ativo aprova/rejeita → comum/banido 403 → invalidação auditável.

### Consistência

Idempotência de oração/pedido; contagens de feed; sem efeitos duplicados sob concorrência.

**Não criar esses registros remotos neste gate.**

## Checklist do proprietário (ordem)

1. Isolar bancos Preview/Production (ver `preview-db-topology.md`).
2. Configurar auth no Vercel (ver `docs/security/auth-and-email.md`).
3. Redeploy Preview e validar health.
4. Autorizar por escrito `migrate deploy` **somente** Preview.
5. Autorizar seed sintético mínimo (opcional).
6. Executar roteiro HTTP acima.

## Declaração

Este documento **não** homologa o sistema para usuários reais.
