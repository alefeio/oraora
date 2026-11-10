# Topologia Preview / Production (banco)

## O que a integração Prisma Postgres na Vercel configura

Quando um banco Prisma Postgres é conectado a um projeto Vercel, a integração costuma definir, por ambiente selecionado:

| Variável | Função típica |
|---|---|
| `DATABASE_URL` | Conexão direta (`db.prisma.io`) |
| `POSTGRES_URL` | Mesmo valor direto |
| `PRISMA_DATABASE_URL` | Mesmo valor direto |
| `DATABASE_URL_POOLED` | Conexão pooled (`pooled.db.prisma.io`) |

Fonte: documentação Prisma Postgres + Vercel Marketplace.

## Achado nesta sprint

No projeto `oraora` (equipe `alefeios-projects`), as quatro variáveis existem nos escopos **Preview** e **Production** (informação fornecida na auditoria).

Isso **não prova isolamento físico**:

- nomes iguais em dois escopos podem apontar ao **mesmo** banco;
- `DATABASE_ENV` é rótulo e não diferencia instâncias;
- fingerprints locais em `.env.local` mostram hosts remotos `db.prisma.io` / `pooled.db.prisma.io` coexistindo com Postgres local `127.0.0.1/intercessao_dev`, mas isso não revela se Preview ≠ Production no remoto.

**Status:** isolamento Preview ↔ Production **não comprovado**.

## Solução recomendada (sem executar nesta sprint)

1. Criar **dois** bancos Prisma Postgres distintos (ex.: `oraora-prod` e `oraora-preview`).
2. Conectar cada um **somente** ao escopo correspondente na integração Vercel (`-e production` / `-e preview`).
3. Confirmar no painel que fingerprints de host/database diferem entre ambientes (sem expor secrets).
4. Só então autorizar `migrate deploy` no Preview, com seed sintético não sensível.
5. Repetir migrate em Production em janela controlada.

### Custo potencial

No plano Free da Prisma Postgres há cota generosa de bancos; o custo adicional típico é zero até extrapolar storage/compute do plano. Em planos pagos, cada banco adicional consome a cota do workspace — validar no painel Prisma antes de criar.

### Passos (proprietário)

1. Prisma Console → criar database Preview.
2. Vercel → Settings → Environment Variables / Integration → desassociar Preview do banco de Production se compartilhado.
3. Associar o novo banco só a Preview.
4. Redeploy Preview e validar health + schema.
5. Autorizar por escrito migrations remotas.

## Procedimento seguro futuro de migrations remotas

1. Comprovar isolamento (fingerprints distintos Preview ≠ Production).
2. Autorização explícita do proprietário.
3. `migrate deploy` **apenas** no alvo Preview, via CI ou máquina com env Preview.
4. Smoke de leitura/escrita sintética no Preview.
5. Só depois, Production, com backup/snapshot disponível.
6. Nunca `db push` em remoto; nunca seed com dados pessoais reais.

## Local

Escrita de testes/seeds/migrations: somente `intercessao_dev` / `intercessao_test` em `127.0.0.1`.
