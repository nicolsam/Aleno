# Solução De Problemas

## Conexão Com Banco Falha

Confira se PostgreSQL está rodando:

```bash
docker compose up -d
```

Confirme que `.env` contém um `DATABASE_URL` válido.

## Prisma Client Está Ausente Ou Desatualizado

Execute:

```bash
pnpm prisma generate
```

Depois reinicie o servidor de desenvolvimento.

## Migrations Não Rodaram

Execute:

```bash
pnpm prisma migrate deploy
```

Para desenvolvimento local, inspecione o estado de migrations antes de criar ou aplicar novas migrations.

## Níveis De Leitura Estão Ausentes

Execute:

```bash
pnpm prisma db seed
```

O app espera níveis de leitura semeados para workflows de dashboard e leitura dos alunos.

## Login Funciona Mas Chamadas Do Dashboard Falham

Verifique no `localStorage` do navegador:

- `token`
- `teacher`

Também confirme que as chamadas de API incluem `Authorization: Bearer <token>`.

## Páginas Admin Retornam Forbidden

O professor logado deve ter `isGlobalAdmin` como true no banco.

## Idioma Parece Errado

Verifique o cookie `NEXT_LOCALE`. O middleware suporta `en` e `pt-BR`, e usa `pt-BR` como fallback.

## Playwright Não Consegue Acessar O App

Playwright espera `http://localhost:3000`. Pare outros servidores nessa porta ou deixe o Playwright reutilizar um servidor compatível existente.
