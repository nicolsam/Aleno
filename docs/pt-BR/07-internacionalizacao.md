# Internacionalização

## Idiomas

Idiomas suportados:

- `en`
- `pt-BR`

Idioma padrão:

- `pt-BR`

## Arquivos De Mensagens

Traduções ficam em:

- `src/messages/en.json`
- `src/messages/pt-BR.json`

Mantenha chaves alinhadas entre os dois arquivos. Ao adicionar uma chave em um idioma, adicione a chave correspondente no outro idioma na mesma mudança.

## Idioma Da Requisição

`src/i18n/request.ts` configura o comportamento de idioma por requisição para `next-intl`.

## Middleware

`src/middleware.ts` escolhe o idioma nesta ordem:

1. cookie `NEXT_LOCALE`.
2. cabeçalho `Accept-Language`.
3. padrão `pt-BR`.

O middleware armazena o idioma escolhido em `NEXT_LOCALE` por um ano.

## Uso No Frontend

Use `useTranslations` para strings localizadas e `useLocale` ao renderizar escolhas específicas por idioma.

Não deixe texto visível ao usuário hard-coded em páginas, a menos que exista um motivo claro. Adicione o texto aos dois arquivos de mensagens.

## Idiomas Da Documentação

A documentação de desenvolvedores é bilíngue. Inglês é canônico; português espelha a mesma estrutura e deve ser atualizado depois das mudanças em inglês.
