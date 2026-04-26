import { NextRequest, NextResponse } from 'next/server'

const SUPPORTED_LOCALES = ['en', 'pt-BR']
const DEFAULT_LOCALE = 'pt-BR'

function getLocaleFromRequest(request: NextRequest): string {
  // 1. Check cookie first (user preference)
  const cookies = request.cookies
  const localeCookie = cookies.get('NEXT_LOCALE')
  if (localeCookie && SUPPORTED_LOCALES.includes(localeCookie.value)) {
    return localeCookie.value
  }

  // 2. Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage) {
    const languages = acceptLanguage.split(',').map(l => l.split(';')[0].trim())
    for (const lang of languages) {
      if (lang.startsWith('pt')) return 'pt-BR'
      if (lang.startsWith('en')) return 'en'
    }
  }

  // 3. Default fallback
  return DEFAULT_LOCALE
}

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const locale = getLocaleFromRequest(request)

  // Create response and set cookie
  const response = NextResponse.next()
  response.cookies.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 31536000,
    sameSite: 'lax',
  })

  return response
}

export const config = {
  matcher: ['/((?!_next|api|_vercel|.*\\..*).*)'],
}
