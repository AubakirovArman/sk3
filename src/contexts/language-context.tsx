'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Language = 'ru' | 'kk' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('ru')

  // Загружаем язык из localStorage при инициализации
  useEffect(() => {
    const savedLanguage = localStorage.getItem('skai-language') as Language
    if (savedLanguage && ['ru', 'kk', 'en'].includes(savedLanguage)) {
      setLanguage(savedLanguage)
    }
  }, [])

  // Сохраняем язык в localStorage при изменении
  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('skai-language', lang)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}