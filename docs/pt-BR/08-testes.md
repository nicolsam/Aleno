# Testes

## Testes Unitários E De Integração

Execute Vitest com:

```bash
pnpm test
```

A configuração do Vitest fica em `vitest.config.ts`. Testes são incluídos a partir de `tests/**/*.test.ts` e rodam em ambiente Node.

Testes existentes cobrem autenticação, auditoria, comportamento admin e rotas de API.

## Testes End-To-End

Execute testes headless do Playwright com:

```bash
pnpm run test:e2e
```

A configuração do Playwright fica em `playwright.config.ts`. Testes ficam em `tests/e2e`.

O comando de web server do Playwright atualmente inicia o app com `npm run dev` em `http://localhost:3000`.

Use modo UI interativo apenas para depuração:

```bash
pnpm run test:e2e:ui
```

## Verificação Obrigatória Antes De Respostas Finais

Depois de mudanças de código, rode as verificações relevantes e corrija falhas causadas pela mudança:

```bash
pnpm test
pnpm run test:e2e
```

Para mudanças apenas em documentação, verifique manualmente links Markdown e exemplos de comandos. Testes completos do app são opcionais, exceto quando a documentação altera snippets executáveis, fluxo de setup ou instruções de teste.

## Dados De Teste E Mocks

Use mocks e fixtures nomeados em `tests/__mocks__` quando possível. Evite stubs anônimos inline para I/O externo.

## Adicionando Testes

- Novo comportamento deve ter testes.
- Correções de bug devem incluir cobertura de regressão.
- Mudanças de API devem testar sucesso, falha de validação, não autorizado e proibido quando relevante.
- Mudanças de fluxo no frontend devem incluir cobertura Playwright quando navegação ou estado do navegador forem afetados.
