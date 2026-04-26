import { getRequestConfig } from 'next-intl/server'
import en from '../messages/en.json'
import ptBR from '../messages/pt-BR.json'

const messages = {
  en,
  'pt-BR': ptBR,
} as const

const SUPPORTED_LOCALES = ['en', 'pt-BR']
const DEFAULT_LOCALE = 'pt-BR'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  // Validate locale
  if (!locale || !SUPPORTED_LOCALES.includes(locale)) {
    locale = DEFAULT_LOCALE
  }

  return {
    locale,
    messages: messages[locale as keyof typeof messages],
  }
})