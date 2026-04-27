# Primeiros Passos

## Pre-requisitos

- Node.js compatível com Next.js 16 e React 19.
- `pnpm`.
- Docker, para o serviço local de PostgreSQL.

## Instalar Dependências

```bash
pnpm install
```

O script `postinstall` executa `prisma generate`, então o Prisma Client deve ser gerado depois da instalação.

## Configurar Ambiente

Copie `.env.example` para `.env` e ajuste os valores quando necessário:

```bash
cp .env.example .env
```

Variáveis obrigatórias:

- `DATABASE_URL`: string de conexão do PostgreSQL.
- `JWT_SECRET`: segredo usado para assinar tokens de autenticação. Use um valor forte em produção.

A URL local padrão do banco é:

```text
postgresql://postgres:postgres@localhost:5432/aleno?schema=public
```

## Iniciar O Banco

```bash
docker compose up -d
```

Isso inicia PostgreSQL 15 na porta `5432` com banco `aleno`, usuário `postgres` e senha `postgres`.

## Preparar O Banco

Execute migrations e seed dos níveis de leitura:

```bash
pnpm prisma migrate deploy
pnpm prisma db seed
```

Para evolução local de schema, use os comandos do Prisma com cuidado e revise migrations geradas antes de comitar.

## Rodar O App

```bash
pnpm dev
```

Abra `http://localhost:3000`.

## Verificar O Projeto

```bash
pnpm test
pnpm run test:e2e
```

Use `pnpm run test:e2e:ui` apenas quando a depuração interativa com Playwright for útil.

## Primeiros Arquivos Para Ler

- `AGENTS.md`: regras do repositório para agentes de código.
- `package.json`: scripts e versões de dependências.
- `prisma/schema.prisma`: modelo de domínio.
- `src/app`: páginas do App Router e rotas de API.
- `src/lib`: código compartilhado de banco, autenticação, admin, auditoria, roteamento e utilidades.
