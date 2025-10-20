'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AuthGuard } from '@/components/auth-guard'
import { useLanguage } from '@/contexts/language-context'
import { translations, type Language } from '@/locales'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface MeetingData {
  id: string
  code: string
  titleRu: string
  titleKk: string
  titleEn: string
  summaryRu: string | null
  summaryKk: string | null
  summaryEn: string | null
  overviewRu: string | null
  overviewKk: string | null
  overviewEn: string | null
  questions: Array<{
    id: string
    number: number
    titleRu: string
    titleKk: string
    titleEn: string
    collapsedTextRu: string
    collapsedTextKk: string
    collapsedTextEn: string
    expandedTextRu: string | null
    expandedTextKk: string | null
    expandedTextEn: string | null
    decisionLabelRu: string | null
    decisionLabelKk: string | null
    decisionLabelEn: string | null
  }>
}

export default function MeetingDetailsPage() {
  const params = useParams<{ meeting: string }>()
  const meetingCode = Array.isArray(params.meeting) ? params.meeting[0] : params.meeting
  const { language } = useLanguage()
  const tDialog = translations[language].dialog

  const [meeting, setMeeting] = useState<MeetingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({})
  
  // TTS states
  const [playingQuestionId, setPlayingQuestionId] = useState<string | null>(null)
  const [loadingQuestionId, setLoadingQuestionId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const response = await fetch('/api/dialog/meetings')
        if (!response.ok) {
          throw new Error('Failed to fetch meetings')
        }
        const data = await response.json()
        if (data.success && data.meetings) {
          const found = data.meetings.find((m: MeetingData) => m.code === meetingCode)
          setMeeting(found || null)
        }
      } catch (error) {
        console.error('[Meeting Details] Failed to fetch:', error)
        setMeeting(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMeeting()
  }, [meetingCode])

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto flex justify-center items-center min-h-[50vh]">
          <div className="h-10 w-10 rounded-full border-4 border-[#d7a13a] border-t-transparent animate-spin" />
        </div>
      </AuthGuard>
    )
  }

  if (!meeting) {
    return (
      <AuthGuard>
        <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-[#333333] rounded-2xl p-10 text-center shadow-sm">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">{tDialog.unknownMeeting}</h1>
            <Link
              href="/dialog"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#d7a13a] text-white text-sm font-medium"
            >
              {tDialog.detailsBackLink}
            </Link>
          </div>
        </div>
      </AuthGuard>
    )
  }

  const toggleQuestion = (number: number) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [number]: !prev[number]
    }))
  }

  const toggleAll = (expand: boolean) => {
    const map = Object.fromEntries(meeting.questions.map((question) => [question.number, expand]))
    setExpandedQuestions(map)
  }

  const selectText = (ru: string | null, kk: string | null, en: string | null): string => {
    if (language === 'kk') return kk || ru || en || ''
    if (language === 'en') return en || ru || kk || ''
    return ru || kk || en || ''
  }

  // Функция озвучки вопроса
  const handleTTSClick = async (questionId: string, decisionLabel: string, collapsedText: string) => {
    try {
      // Если уже играет это сообщение - остановить
      if (playingQuestionId === questionId) {
        audioRef.current?.pause()
        if (videoRef.current) {
          videoRef.current.pause()
          videoRef.current.currentTime = 0
        }
        setPlayingQuestionId(null)
        return
      }

      // Остановить предыдущее аудио
      if (audioRef.current) {
        audioRef.current.pause()
      }
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.currentTime = 0
      }

      setLoadingQuestionId(questionId)

      // Формируем текст для озвучки: решение + краткое обоснование
      let ttsText = ''
      if (decisionLabel) {
        if (language === 'ru') {
          ttsText += `Голосую: ${decisionLabel}. `
        } else if (language === 'kk') {
          ttsText += `Шешім: ${decisionLabel}. `
        } else {
          ttsText += `Decision: ${decisionLabel}. `
        }
      }
      if (collapsedText) {
        if (language === 'ru') {
          ttsText += `Краткое заключение: ${collapsedText}`
        } else if (language === 'kk') {
          ttsText += `Қысқаша қорытынды: ${collapsedText}`
        } else {
          ttsText += `Brief summary: ${collapsedText}`
        }
      }

      console.log('[Meeting TTS] Sending text to TTS:', ttsText.substring(0, 100))

      // Запрос к TTS API
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: ttsText,
          language: language === 'ru' ? 'ru-RU' : language === 'kk' ? 'kk-KZ' : 'en-US'
        }),
      })

      if (!response.ok) {
        throw new Error('TTS request failed')
      }

      const data = await response.json()
      
      if (!data.audioUrl) {
        throw new Error('No audio URL in response')
      }

      // Воспроизвести аудио
      const audio = new Audio(data.audioUrl)
      audioRef.current = audio
      
      audio.onended = () => {
        console.log('[Meeting TTS] Audio ended')
        setPlayingQuestionId(null)
        // Останавливаем видео
        if (videoRef.current) {
          videoRef.current.pause()
          videoRef.current.currentTime = 0
        }
      }
      
      audio.onerror = () => {
        console.error('[Meeting TTS] Audio playback error')
        setPlayingQuestionId(null)
        setLoadingQuestionId(null)
        if (videoRef.current) {
          videoRef.current.pause()
          videoRef.current.currentTime = 0
        }
        alert('Ошибка воспроизведения аудио')
      }

      await audio.play()
      setPlayingQuestionId(questionId)
      setLoadingQuestionId(null)
      
      // Запускаем видео
      if (videoRef.current) {
        videoRef.current.currentTime = 0
        videoRef.current.loop = false
        await videoRef.current.play()
      }

    } catch (error) {
      console.error('[Meeting TTS] Error:', error)
      setLoadingQuestionId(null)
      alert('Не удалось озвучить вопрос')
    }
  }

  const title = tDialog.detailsPageTitle(meeting.code)
  const meetingTitle = selectText(meeting.titleRu, meeting.titleKk, meeting.titleEn)
  const meetingSummary = selectText(meeting.summaryRu, meeting.summaryKk, meeting.summaryEn)
  const meetingOverview = selectText(meeting.overviewRu, meeting.overviewKk, meeting.overviewEn)

  return (
    <AuthGuard>
      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link
            href="/dialog"
            className="text-sm text-[#d7a13a] hover:underline"
          >
            ← {tDialog.detailsBackLink}
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-50 mb-2">{title}</h1>
          <p className="text-base text-gray-600 dark:text-gray-400 mb-6">{meetingTitle}</p>

          {(meetingSummary || meetingOverview) && (
            <div className="mb-6 text-sm text-gray-600 dark:text-gray-300 space-y-2">
              {meetingSummary && <p>{meetingSummary}</p>}
              {meetingOverview && <p>{meetingOverview}</p>}
            </div>
          )}
        </motion.div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-4">
            {tDialog.analysisResults}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {tDialog.selectTabToView}
          </p>

          {/* Видео и вопросы в одной строке */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Видео блок слева */}
            <div className="flex-shrink-0">
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-2xl overflow-hidden">
                {/* Видео в покое - показывается когда TTS не играет (базовое) */}
                <video
                  src="/IMG_3584.MOV"
                  className={cn(
                    "w-full h-full object-cover object-[46%_center] transition-opacity duration-300",
                    playingQuestionId ? "opacity-0" : "opacity-100"
                  )}
                  playsInline
                  muted
                  autoPlay
                  loop
                />
                {/* Видео говорящее - показывается когда TTS играет (поверх) */}
                <video
                  ref={videoRef}
                  src="/answer1.mov"
                  className={cn(
                    "absolute inset-0 w-full h-full object-cover object-[46%_center] transition-opacity duration-300",
                    playingQuestionId ? "opacity-100" : "opacity-0"
                  )}
                  playsInline
                  muted
                />
              </div>
            </div>

            {/* Список вопросов справа */}
            <div className="flex-1  bg-white rounded-2xl p-6 space-y-4">
            {meeting.questions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">{tDialog.questionsAbsent}</p>
            ) : (
              meeting.questions.map((question) => {
                const isExpanded = expandedQuestions[question.number]
                const questionTitle = selectText(question.titleRu, question.titleKk, question.titleEn)
                const decisionLabel = selectText(question.decisionLabelRu, question.decisionLabelKk, question.decisionLabelEn)
                const collapsedText = selectText(question.collapsedTextRu, question.collapsedTextKk, question.collapsedTextEn)
                const expandedText = selectText(question.expandedTextRu, question.expandedTextKk, question.expandedTextEn)

                return (
                  <motion.div
                    key={question.number}
                    id={`question-${question.number}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: question.number * 0.05 }}
                    className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                          {questionTitle}
                        </h3>
                        <p className="text-base font-semibold text-green-700 dark:text-green-400 mb-3">
                          {decisionLabel || 'ГОЛОСУЮ:ЗА'}
                        </p>
                        
                        {/* Кнопка озвучки */}
                        <button
                          onClick={() => handleTTSClick(question.id, decisionLabel || '', collapsedText)}
                          disabled={loadingQuestionId === question.id}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-[#d7a13a] dark:hover:text-[#d7a13a] transition-colors disabled:opacity-50 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2c2c2c]"
                          title={playingQuestionId === question.id ? 'Остановить' : 'Озвучить решение и заключение'}
                        >
                          {loadingQuestionId === question.id ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>{tDialog.loading}</span>
                            </>
                          ) : (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={cn('w-4 h-4', playingQuestionId === question.id && 'text-[#d7a13a]')}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                                />
                              </svg>
                              <span>{playingQuestionId === question.id ? tDialog.stopResponse : tDialog.speakOut}</span>
                            </>
                          )}
                        </button>
                      </div>
                      <button
                        onClick={() => toggleQuestion(question.number)}
                        className="text-sm font-medium text-gray-700 dark:text-gray-300 underline hover:text-[#d7a13a] transition whitespace-nowrap"
                      >
                        {isExpanded ? tDialog.hide : tDialog.view}
                      </button>
                    </div>

                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="pt-3 border-t border-blue-200 dark:border-blue-700 space-y-3"
                      >
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            {tDialog.briefConclusion}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {collapsedText || (language === 'kk' ? 'Ақпарат жоқ' : language === 'en' ? 'Information not available' : 'Информация отсутствует')}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            {tDialog.reasoning}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {expandedText || tDialog.noDetails}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )
              })
            )}
            </div>
          </div>
        </section>
      </div>
    </AuthGuard>
  )
}
