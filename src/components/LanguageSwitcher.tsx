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

  const switchLocale = (newLocale: string) => {
    if (locale === newLocale) return
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`
    window.location.reload()
  }

  if (!mounted) {
    return (
      <div className="w-[104px] h-[40px] bg-white/5 rounded-full animate-pulse border border-white/5" />
    )
  }

  return (
    <div 
      className="relative flex items-center p-1 bg-black/20 backdrop-blur-sm rounded-full border border-white/10 shadow-inner"
      title={t('language')}
    >
      {/* Sliding Active Pill Background */}
      <div
        className={`absolute left-1 top-1 w-12 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow transition-transform duration-300 ease-out ${
          locale === 'pt-BR' ? 'translate-x-full' : 'translate-x-0'
        }`}
      />
      
      <button
        onClick={() => switchLocale('en')}
        className={`relative z-10 flex items-center justify-center w-12 h-8 text-xs font-bold tracking-wider transition-colors duration-300 rounded-full ${
          locale === 'en' ? 'text-white drop-shadow-md' : 'text-gray-400 hover:text-white'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => switchLocale('pt-BR')}
        className={`relative z-10 flex items-center justify-center w-12 h-8 text-xs font-bold tracking-wider transition-colors duration-300 rounded-full ${
          locale === 'pt-BR' ? 'text-white drop-shadow-md' : 'text-gray-400 hover:text-white'
        }`}
      >
        PT
      </button>
    </div>
  )
}