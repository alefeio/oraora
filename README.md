# Rede de Intercessão Solidária

Nome de trabalho provisório: **Ora por Mim**.

Fundação executável (Sprint F): Next.js 16, Prisma 7, PostgreSQL, Better Auth.

## Pré-requisitos

- Node.js **22+** (necessário para `prisma dev` / Prisma 7 local)
- npm
- Docker Desktop (opcional; compose disponível em `docker-compose.yml`)

## Ambiente local (caminho verificado)

```bash
nvm use 22.23.4   # ou qualquer Node 22+
cp .env.example .env.local
# edite BETTER_AUTH_SECRET

npx prisma dev --name intercessao --detach
npx prisma dev ls
# copie a URL TCP (postgres://postgres:postgres@localhost:<porta>/...)
# crie o database intercessao_dev e atualize DATABASE_URL / DIRECT_URL / RUNTIME_DATABASE_URL

npx prisma migrate deploy
npm run db:seed:foundation
npm run dev
```

Aplicação: http://localhost:3000  
API de saúde: http://localhost:3000/api/v1/health  
Cadastro/login: `/signup` e `/login`

## Testes e lint

```bash
npm test
npm run lint
npx tsc --noEmit
```

## Documentação

- `docs/product/product-contract.md` — contrato fiel ao PDF
- `docs/architecture/` — fundação e contratos de domínio
- `docs/security/` — autenticação e isolamento de banco

O PDF original permanece fora do Git, em `../Arquivos/`.

## Autenticação (estado atual)

Better Auth com cadastro público, sessão cookie e hooks de verificação/recuperação.

Em desenvolvimento, e-mails vão para console/`tmp/auth-emails.log`.  
**Não está pronto para uso público** sem provedor de e-mail real.

## Fora do escopo desta sprint

Pedidos, orações, campanhas, carteira, doações, deploy, merge e remote GitHub.
