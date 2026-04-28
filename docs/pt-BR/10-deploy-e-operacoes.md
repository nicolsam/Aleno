# Deploy E Operações

## Build

O script de build de produção é:

```bash
pnpm build
```

Ele executa:

```bash
prisma migrate deploy && next build
```

Isso significa que deploys de produção precisam de conectividade com banco e permissão de migration antes do passo de build do Next.js.

## Start

```bash
pnpm start
```

Isso executa `next start` depois de um build bem-sucedido.

## Ambiente Obrigatório

- `DATABASE_URL`: string de conexão do PostgreSQL.
- `JWT_SECRET`: segredo forte para assinatura JWT.

`prisma.config.ts` também suporta `DIRECT_URL` quando fornecido.

## Operações De Banco

- Migrations ficam em `prisma/migrations`.
- Aplique migrations com `prisma migrate deploy`.
- Execute seed dos níveis de leitura com `pnpm prisma db seed` quando um novo ambiente precisar dos dados base.

## Observabilidade

A aplicação atualmente usa console logging e logs de auditoria no banco. Logs de auditoria são armazenados no model `AuditLog` e expostos por rotas admin.

## Notas Operacionais

- Mantenha `JWT_SECRET` estável entre restarts ou tokens ativos ficarão inválidos.
- Use um banco PostgreSQL gerenciado em produção.
- Restrinja credenciais do banco às permissões mínimas necessárias para o modelo de deploy.
- Revise rotas admin com cuidado porque elas expõem dados operacionais globais.
