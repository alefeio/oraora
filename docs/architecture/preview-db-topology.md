# Topologia Preview / Production (banco)

## Status Gate 2.4

| Afirmação | Classificação |
|---|---|
| Quatro variáveis Prisma Postgres existem no projeto Vercel `oraora` | **Verificado** |
| Cada variável está associada a **Preview e Production no mesmo registro** | **Verificado** (`vercel env ls`) |
| Não há overrides por branch Git nas variáveis listadas | **Verificado** (nenhum `gitBranch` visível na listagem) |
| Preview e Production são instâncias físicas distintas | **Não comprovado** |
| Preview e Production compartilham a mesma string/instância | **Evidência forte de compartilhamento de configuração** (um único secret por chave cobrindo ambos os escopos); confirmação inequívoca do `storeId` Prisma exige painel do proprietário |
| Migrations remotas aplicadas | **Não comprovado / bloqueado** |
| Escrita remota autorizada | **Bloqueado por segurança** (`REMOTE MIGRATION AUTHORIZATION: NOT GRANTED`) |

## Integração Prisma Postgres → Vercel

Quando um banco Prisma Postgres é conectado, a integração costuma definir:

| Variável | Função típica |
|---|---|
| `DATABASE_URL` | Conexão direta (`db.prisma.io`) — CLI / migrations |
| `POSTGRES_URL` | Alias direto |
| `PRISMA_DATABASE_URL` | Alias direto |
| `DATABASE_URL_POOLED` | Runtime serverless (`pooled.db.prisma.io`) |

## Inventário Vercel (Gate 2.4)

Projeto: `alefeios-projects/oraora` (`prj_JAOMoEe1NysvI0TprfTRmzwMrKYL`).

Variáveis presentes (nomes apenas):

| Nome | Tipo | Escopos |
|---|---|---|
| `DATABASE_URL` | Secret | Preview, Production |
| `DATABASE_URL_POOLED` | Secret | Preview, Production |
| `POSTGRES_URL` | Secret | Preview, Production |
| `PRISMA_DATABASE_URL` | Secret | Preview, Production |

**Ausentes** na listagem do projeto (Gate 2.4): qualquer variável de autenticação (`BETTER_AUTH_*`, `AUTH_EMAIL_*`, `RESEND_*`, `NEXT_PUBLIC_APP_URL`, etc.).

Não há variável distinta “só Preview” nem “só Production” para o banco.

## Evidência de risco

1. Um único registro de secret cobrindo Preview **e** Production é o padrão clássico de **mesmo valor / mesma instância**.
2. Nomes de host genéricos (`db.prisma.io`) **não** isolam ambientes.
3. `DATABASE_ENV` **não** prova isolamento (nem está configurado no Vercel).
4. Sem `storeId` / nome de database distinto por ambiente no painel, **não** se declara isolamento físico.

## Recurso atual a preservar

Manter intacto o banco Prisma Postgres já vinculado à Production (e atualmente também exposto ao Preview via as mesmas secrets).

**Não** desconectar Production sem plano de cutover.

## Solução recomendada (ação do proprietário — não executada)

1. **Preservar** o banco atual como Production.
2. **Criar** um segundo Prisma Postgres (ex.: `oraora-preview`).
3. Na integração Vercel / Prisma:
   - Production → apenas o banco de Production;
   - Preview → apenas o banco Preview;
   - remover o compartilhamento Preview+Production nas quatro variáveis.
4. Confirmar no painel que os identificadores de instância / `storeId` diferem.
5. Redeploy da branch de Preview.
6. Só então autorizar `migrate deploy` no Preview.

### Custo / cota

Plano Prisma Free/Starter: múltiplos databases na cota do workspace; custo tipicamente zero até extrapolar storage/compute. Validar cota no console Prisma antes de criar.

### Procedimento exato (proprietário)

1. Abrir [Prisma Console](https://console.prisma.io) → workspace do Ora Ora.
2. Anotar o nome/ID do database **atual** (preservar como Production).
3. Create database → nome sugerido `oraora-preview`.
4. Vercel → Project `oraora` → Settings → Environment Variables / Integrations:
   - garantir que Preview **não** herda as secrets de Production;
   - conectar o novo database somente ao ambiente Preview (as quatro variáveis).
5. Confirmar `vercel env ls`: linhas **separadas** Preview vs Production (não uma linha “Preview, Production”).
6. Autorizar por escrito o Gate seguinte de migrations Preview.

**Esta etapa está interrompida até a ação acima.** Nenhuma criação/desconexão automática foi feita.

## Runtime da aplicação

- Fora da Vercel: `RUNTIME_DATABASE_URL` / `DATABASE_URL` local (`intercessao_dev`) têm prioridade; pooled remoto não é escolhido automaticamente.
- Na Vercel: runtime prefere `DATABASE_URL_POOLED`; migrations usam conexão direta.

## Local

Escrita de testes/seeds/migrations: somente `intercessao_dev` / `intercessao_test` em `127.0.0.1`.
