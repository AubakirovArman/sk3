/**
 * TTS Button Component
 * Play/Pause button with loading and error states
 */

'use client'

import { motion } from 'framer-motion'

interface TTSButtonProps {
  onClick: () => void
  isPlaying: boolean
  isPaused: boolean
  isLoading: boolean
  isError: boolean
  className?: string
  language?: 'ru' | 'kk' | 'en' // Язык интерфейса
}

export function TTSButton({
  onClick,
  isPlaying,
  isPaused,
  isLoading,
  isError,
  className = '',
  language = 'ru',
}: TTSButtonProps) {
  // Переводы для UI
  const labels = {
    ru: {
      generating: 'Генерация...',
      error: 'Ошибка',
      pause: 'Пауза',
      continue: 'Продолжить',
      speak: '🔊 Озвучить',
      generatingTooltip: 'Генерация аудио...',
      errorTooltip: 'Ошибка озвучки',
      pauseTooltip: 'Пауза',
      continueTooltip: 'Продолжить',
      speakTooltip: 'Озвучить',
    },
    kk: {
      generating: 'Генерация...',
      error: 'Қате',
      pause: 'Кідірту',
      continue: 'Жалғастыру',
      speak: '🔊 Дауыстау',
      generatingTooltip: 'Аудио генерациясы...',
      errorTooltip: 'Дауыстау қатесі',
      pauseTooltip: 'Кідірту',
      continueTooltip: 'Жалғастыру',
      speakTooltip: 'Дауыстау',
    },
    en: {
      generating: 'Generating...',
      error: 'Error',
      pause: 'Pause',
      continue: 'Continue',
      speak: '🔊 Speak',
      generatingTooltip: 'Generating audio...',
      errorTooltip: 'Speech error',
      pauseTooltip: 'Pause',
      continueTooltip: 'Continue',
      speakTooltip: 'Speak',
    },
  }

  const t = labels[language]

  const getIcon = () => {
    if (isLoading) {
      return (
        <svg
          className="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )
    }

    if (isError) {
      return (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      )
    }

    if (isPlaying) {
      return (
        <svg
          className="h-5 w-5"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
        </svg>
      )
    }

    return (
      <svg
        className="h-5 w-5"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M8 5v14l11-7z" />
      </svg>
    )
  }

  const getTooltip = () => {
    if (isLoading) return t.generatingTooltip
    if (isError) return t.errorTooltip
    if (isPlaying) return t.pauseTooltip
    if (isPaused) return t.continueTooltip
    return t.speakTooltip
  }

  const getButtonClass = () => {
    const baseClass = `group relative inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${className}`
    
    if (isError) {
      return `${baseClass} bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30`
    }

    if (isLoading) {
      return `${baseClass} bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 cursor-wait`
    }

    if (isPlaying) {
      return `${baseClass} bg-[#d7a13a] text-white border border-[#d7a13a] hover:bg-[#c8921f] shadow-lg shadow-[#d7a13a]/30`
    }

    return `${baseClass} bg-white dark:bg-[#333333] text-[#d7a13a] border border-[#d7a13a]/30 hover:bg-[#d7a13a]/5 dark:hover:bg-[#d7a13a]/10 hover:border-[#d7a13a]`
  }

  return (
    <motion.button
      onClick={onClick}
      disabled={isLoading}
      className={getButtonClass()}
      whileHover={{ scale: isLoading ? 1 : 1.02 }}
      whileTap={{ scale: isLoading ? 1 : 0.98 }}
      title={getTooltip()}
    >
      <span className="flex items-center gap-2">
        {getIcon()}
        <span>
          {isLoading
            ? t.generating
            : isError
            ? t.error
            : isPlaying
            ? t.pause
            : isPaused
            ? t.continue
            : t.speak}
        </span>
      </span>

      {/* Пульсирующий эффект при воспроизведении */}
      {isPlaying && (
        <motion.span
          className="absolute inset-0 rounded-xl bg-[#d7a13a]"
          initial={{ opacity: 0.5, scale: 1 }}
          animate={{ opacity: 0, scale: 1.1 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      )}
    </motion.button>
  )
}
