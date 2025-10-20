'use client'

import { useState } from 'react'
import { useLanguage, type Language } from '@/contexts/language-context'
import { motion, AnimatePresence } from 'framer-motion'

const languages = [
  { code: 'ru' as Language, name: 'Русский', flag: '🇷🇺' },
  { code: 'kk' as Language, name: 'Қазақша', flag: '🇰🇿' },
  { code: 'en' as Language, name: 'English', flag: '🇺🇸' }
]

export function LanguageSwitch() {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const currentLanguage = languages.find(lang => lang.code === language)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg bg-white dark:bg-[#333333] border border-gray-200 dark:border-[#d7a13a]/30 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm transition-colors hover:bg-gray-50 dark:hover:bg-[#404040]"
        aria-label="Выбрать язык"
      >
        <span className="hidden sm:block">{currentLanguage?.name}</span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full z-20 mt-2 w-48 rounded-lg border border-gray-200 dark:border-[#d7a13a]/30 bg-white dark:bg-[#333333] shadow-lg"
            >
              <div className="py-1">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code)
                      setIsOpen(false)
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-[#404040] ${
                      language === lang.code
                        ? 'bg-[#d7a13a]/10 text-[#d7a13a] font-medium'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span>{lang.name}</span>
                    {language === lang.code && (
                      <svg className="ml-auto h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}