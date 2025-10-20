'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/contexts/language-context'
import { translations } from '@/locales'

export default function Home() {
  const { language } = useLanguage()
  const t = translations[language].home
  
  const offerings = [
    {
      href: '/dialog',
      title: t.cards.virtualDirector.title,
      description: t.cards.virtualDirector.description,
    },
    {
      href: '/virtual-director',
      title: t.cards.vnd.title,
      description: t.cards.vnd.description,
    },
  ];
  return (
    <main className="min-h-screen bg-[#f8f6f1] dark:bg-[#1a1a1a] pt-16 lg:pt-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 pb-16 pt-12 sm:gap-16 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12 items-center"
        >
          {/* Левая часть: Заголовок */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl">
              {t.title} <br className="hidden sm:block"/>{' '}
              
            </h1>
          </div>

           {/* Центр: Изображение девушки */}
           <div className="flex items-center justify-center">
             <div className="relative w-full max-w-[224px] sm:max-w-[256px] md:max-w-[288px] lg:max-w-[326px]">
               <Image 
                 src="/1234.png"
                 alt="SK AI"
                 width={407}
                 height={359}
                 className="w-full h-auto object-cover rounded-lg"
                 priority
               />
             </div>
           </div>

          {/* Правая часть: Описание */}
          <div className="flex flex-col gap-4 text-center lg:text-left sm:gap-5">
            <p className="text-xs leading-relaxed text-slate-600 dark:text-gray-300 sm:text-sm md:text-base">
              {t.subtitle}
            </p>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-gray-300 sm:text-sm md:text-base">
              {t.description}
            </p>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-2"
        >
          {offerings.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 dark:border-[#d7a13a]/30 bg-white dark:bg-[#2a2a2a] p-6 shadow-[0_25px_80px_-60px_rgba(15,23,42,0.65)] dark:shadow-[0_25px_80px_-60px_rgba(215,161,58,0.3)] transition-all duration-300 hover:-translate-y-1 hover:border-[#d7a13a]/60 hover:shadow-[0_40px_90px_-60px_rgba(215,161,58,0.55)] sm:rounded-3xl sm:p-7"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center rounded-full border border-[#d7a13a]/40 bg-[#fff8ea] px-2.5 py-1 text-[10px] font-semibold uppercase text-[#d7a13a] transition-colors duration-300 group-hover:border-[#d7a13a] group-hover:bg-[#d7a13a] group-hover:text-white sm:px-3 sm:text-xs">
                  SK AI
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 dark:border-[#d7a13a]/50 text-slate-500 dark:text-gray-400 transition-colors duration-300 group-hover:border-[#d7a13a] group-hover:bg-[#fff8ea] dark:group-hover:bg-[#d7a13a]/20 group-hover:text-[#d7a13a] sm:h-12 sm:w-12">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="transition-transform duration-300 group-hover:translate-x-1 sm:w-[22px] sm:h-[22px]"
                  >
                    <path
                      d="M5 12h13"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M13 6l5.5 6L13 18"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
              <div className="mt-5 flex flex-1 flex-col text-left sm:mt-6">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">{item.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-500 dark:text-gray-300 sm:mt-3 sm:text-base">
                  {item.description}
                </p>
              </div>
              <div className="mt-5 text-sm font-medium text-[#d7a13a] opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:mt-6">
                {t.learnMore}
              </div>
            </Link>
          ))}
        </motion.section>
      </div>
    </main>
  )
}
