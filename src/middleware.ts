import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  locales: ['en', 'pt-BR'],
  defaultLocale: 'pt-BR',
  localePrefix: 'never',
})

export const config = {
  matcher: ['/((?!_next|api|_vercel|.*\\..*).*)'],
}