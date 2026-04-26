import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'
import en from '../messages/en.json'
import ptBR from '../messages/pt-BR.json'

const messages = {
  en,
  'pt-BR': ptBR,
} as const

const SUPPORTED_LOCALES = ['en', 'pt-BR']
const DEFAULT_LOCALE = 'pt-BR'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  let locale = cookieStore.get('NEXT_LOCALE')?.value

  if (!locale) {
    const headersList = await headers()
    const acceptLanguage = headersList.get('accept-language')
    if (acceptLanguage) {
      const languages = acceptLanguage.split(',').map(l => l.split(';')[0].trim())
      for (const lang of languages) {
        if (lang.startsWith('pt')) {
          locale = 'pt-BR'
          break
        }
        if (lang.startsWith('en')) {
          locale = 'en'
          break
        }
      }
    }
  }

  // Validate locale
  if (!locale || !SUPPORTED_LOCALES.includes(locale)) {
    locale = DEFAULT_LOCALE
  }

  return {
    locale,
    messages: messages[locale as keyof typeof messages],
  }
})