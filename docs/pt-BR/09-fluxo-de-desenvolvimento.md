# Fluxo De Desenvolvimento

## Antes De Alterar Código

1. Leia `AGENTS.md`.
2. Confira o estado atual do repositório com `git status --short`.
3. Leia a implementação e os testes próximos antes de editar.
4. Para mudanças em Next.js, leia a documentação local relevante em `node_modules/next/dist/docs/`.

Este projeto usa uma versão de Next.js mais nova que muitos exemplos online. Trate a documentação local e avisos de depreciação como fontes autoritativas.

## Diretrizes De Implementação

- Siga estrutura e nomes existentes.
- Mantenha funções focadas e tipadas.
- Mantenha validação de rotas perto dos route handlers.
- Use `src/lib` para comportamento compartilhado.
- Evite alterar formatos de resposta da API sem atualizar consumidores do frontend e testes.
- Preserve comportamento de soft delete para escolas, turmas e alunos.
- Mantenha mensagens em inglês e português sincronizadas.

## Mudanças No Banco

Quando uma mudança afetar o schema do Prisma:

1. Atualize `prisma/schema.prisma`.
2. Gere e revise uma migration.
3. Atualize seed se dados de referência mudarem.
4. Atualize lógica de API, formulários do frontend e testes.
5. Documente o comportamento em `docs`.

## Mudanças Na Documentação

Atualize inglês primeiro, depois português. Mantenha títulos e ordem dos arquivos alinhados entre `docs/en` e `docs/pt-BR`.

## Verificações Finais

Use as verificações relevantes para a mudança:

```bash
pnpm test
pnpm run test:e2e
```

Se os testes falharem por causa da sua mudança, melhore o código e rode novamente as verificações que falharam.
