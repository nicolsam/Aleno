# Internationalization

## Locales

Supported locales:

- `en`
- `pt-BR`

Default locale:

- `pt-BR`

## Message Files

Translations live in:

- `src/messages/en.json`
- `src/messages/pt-BR.json`

Keep keys aligned between both files. When adding a key in one language, add the matching key in the other language in the same change.

## Request Locale

`src/i18n/request.ts` configures request-time locale behavior for `next-intl`.

## Middleware

`src/middleware.ts` chooses the locale in this order:

1. `NEXT_LOCALE` cookie.
2. `Accept-Language` request header.
3. default `pt-BR`.

The middleware stores the selected locale in `NEXT_LOCALE` for one year.

## Frontend Usage

Use `useTranslations` for localized strings and `useLocale` when rendering locale-specific UI choices.

Do not hard-code user-facing text in pages unless there is a clear reason. Add it to both message files instead.

## Documentation Languages

Developer docs are bilingual. English is canonical; Portuguese mirrors the same structure and should be updated after English changes.
