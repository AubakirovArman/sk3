'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { ThemeToggle } from './theme-toggle'
import { useLanguage } from '@/contexts/language-context'
import { LanguageSwitch } from './language-switch'
import { translations } from '@/locales'

const getNavigationItems = (language: string) => {
  const t = translations[language as keyof typeof translations].navigation;
  return [
    { name: t.home, href: '/' },
    { name: t.dialog , href: '/virtual-director' },
    { name: t.virtualDirector, href: '/dialog' },

  ];
};

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { language } = useLanguage()
  const t = translations[language].navigation
  const navigationItems = getNavigationItems(language)

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/auth/signin')
  }

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-[#2a2a2a] shadow-sm border-b border-gray-200 dark:border-[#d7a13a]/30">
        <div className="flex items-center justify-between px-4 py-3">
          <Image 
            src="/image.png" 
            alt="SKAI Logo" 
            width={80} 
            height={26} 
            className="h-6 w-auto"
          />
          <div className="flex items-center gap-2">
            <LanguageSwitch />
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#333333] transition-colors"
            >
              <svg className="w-6 h-6 text-gray-900 dark:text-gray-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      <nav className="hidden lg:block fixed top-0 left-0 right-0 bg-white dark:bg-[#2a2a2a] shadow-lg border-b border-gray-200 dark:border-[#d7a13a]/30 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <Image 
              src="/image.png" 
              alt="SKAI Logo" 
              width={120} 
              height={40} 
              className="h-10 w-auto"
            />
          </div>

          <div className="flex-1 flex justify-center">
            <nav className="flex space-x-8">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200',
                      isActive
                        ? 'bg-[#d7a13a]/10 text-[#d7a13a]'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#333333]'
                    )}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <LanguageSwitch />
            <ThemeToggle />
            {session ? (
              <div className="flex items-center space-x-3">
                {(session.user as any)?.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="px-3 py-1 text-xs font-medium text-purple-600 dark:text-purple-400 border border-purple-600 dark:border-purple-400 rounded hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-200"
                  >
                    Админ-панель
                  </Link>
                )}
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {session.user?.name || t.user}
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors duration-200"
                >
                  {t.signOut}
                </button>
              </div>
            ) : (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {t.systemVersion}
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}
