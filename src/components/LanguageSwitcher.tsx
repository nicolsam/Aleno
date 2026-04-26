'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'

export default function LanguageSwitcher() {
  const locale = useLocale()
  const t = useTranslations('nav')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleLocale = () => {
    const newLocale = locale === 'en' ? 'pt-BR' : 'en'
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`
    window.location.reload()
  }

  if (!mounted) {
    return (
      <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300">
        <span>PT</span>
      </button>
    )
  }

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
      title={t('language')}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A8 8 0 016 12l3.5-2 1.5 2M12 16l-3-2-1.5-2M6 12l3.5 2 1.5-2" />
      </svg>
      <span>{locale === 'en' ? 'EN' : 'PT'}</span>
    </button>
  )
}