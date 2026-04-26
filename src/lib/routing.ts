export const routing = {
  locales: ['en', 'pt-BR'] as const,
  defaultLocale: 'pt-BR' as const,
  localePrefix: 'as-needed' as const,
}

export type Locale = (typeof routing.locales)[number]