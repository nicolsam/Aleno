# Alfabetiza Developer Handbook

This folder contains the long-term developer documentation for Alfabetiza.

English is the canonical source. The Portuguese documentation mirrors the same structure so maintainers can move between both languages predictably.

## English

1. [Getting Started](en/01-getting-started.md)
2. [Project Architecture](en/02-project-architecture.md)
3. [Database](en/03-database.md)
4. [Auth And Sessions](en/04-auth-and-sessions.md)
5. [API Reference](en/05-api-reference.md)
6. [Frontend](en/06-frontend.md)
7. [Internationalization](en/07-internationalization.md)
8. [Testing](en/08-testing.md)
9. [Development Workflow](en/09-development-workflow.md)
10. [Deployment And Operations](en/10-deployment-and-operations.md)
11. [Troubleshooting](en/11-troubleshooting.md)

## Português Do Brasil

1. [Primeiros Passos](pt-BR/01-primeiros-passos.md)
2. [Arquitetura Do Projeto](pt-BR/02-arquitetura-do-projeto.md)
3. [Banco De Dados](pt-BR/03-banco-de-dados.md)
4. [Autenticação E Sessões](pt-BR/04-autenticacao-e-sessoes.md)
5. [Referência Da API](pt-BR/05-referencia-da-api.md)
6. [Frontend](pt-BR/06-frontend.md)
7. [Internacionalização](pt-BR/07-internacionalizacao.md)
8. [Testes](pt-BR/08-testes.md)
9. [Fluxo De Desenvolvimento](pt-BR/09-fluxo-de-desenvolvimento.md)
10. [Deploy E Operações](pt-BR/10-deploy-e-operacoes.md)
11. [Solução De Problemas](pt-BR/11-solucao-de-problemas.md)

## Maintenance Rules

- Update English first, then mirror the same change in Portuguese.
- Keep command examples in sync with `package.json`, `.env.example`, `docker-compose.yml`, and Prisma configuration.
- Keep API documentation behavior-focused. Link to route files in code reviews when exact implementation details matter.
- When Next.js behavior changes, read `node_modules/next/dist/docs/` before updating related docs.
