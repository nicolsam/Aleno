# Arquitetura Do Projeto

## Stack

- Next.js `16.2.4` com App Router.
- React `19.2.4`.
- TypeScript com modo strict habilitado.
- Prisma `7.8.0` com PostgreSQL.
- `next-intl` para mensagens em inglês e português do Brasil.
- Vitest para testes unitários e de integração.
- Playwright para testes end-to-end.
- Tailwind CSS e componentes locais de UI para estilos.

## Estrutura Principal

- `src/app`: páginas, layouts e route handlers de API.
- `src/components`: UI compartilhada, skeletons e componentes da aplicação.
- `src/lib`: helpers compartilhados de autenticação, Prisma, auditoria, admin e utilidades.
- `src/messages`: arquivos JSON de mensagens por idioma.
- `src/middleware.ts`: detecção de idioma e cookie `NEXT_LOCALE`.
- `prisma`: schema, migrations e seed.
- `tests`: testes Vitest e testes E2E com Playwright.
- `docs`: handbook de desenvolvedores.

## Funcionamento Em Runtime

O navegador guarda o token de autenticação e o payload do professor em `localStorage`. As páginas do dashboard leem o token e chamam rotas de API usando `Authorization: Bearer <token>`.

As rotas de API validam tokens, usam Prisma para acesso ao banco e aplicam acesso professor-escola por meio de linhas em `TeacherSchool`. Rotas somente para admin usam `verifyAdmin`.

O dashboard suporta filtro de escola selecionada armazenado em `localStorage` como `selectedSchool`. `src/app/dashboard/layout.tsx` transmite mudanças com o evento de navegador `schoolChanged`.

## Convenções Importantes

- Use o alias `@/*` para arquivos dentro de `src`.
- Mantenha route handlers em `src/app/api`.
- Mantenha rotas visuais em `src/app`.
- Mantenha helpers de domínio compartilhados em `src/lib`.
- Antes de alterar comportamento do Next.js, leia a documentação local relevante em `node_modules/next/dist/docs/`.
