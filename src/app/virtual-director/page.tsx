'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect, useMemo } from 'react'
import { AuthGuard } from '@/components/auth-guard'
import * as mammoth from 'mammoth'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import MarkdownRender from '@/components/markdown-render'
import { SummaryView } from './summary-view'
import { useLanguage } from '@/contexts/language-context'
import { translations } from '@/locales'
import { useTTS } from '@/hooks/useTTS'
import { TTSButton } from '@/components/tts-button'
import { preloadTTSAudio, type PreloadProgress } from '@/lib/tts-preloader'
import { sectionTitles, type Language } from '@/lib/virtual-director-translations'

interface AnalysisResult {
  vnd: string
  np: string
  summary: string
  fileName?: string
  timestamp?: Date
  language?: 'ru' | 'kk' | 'en' // Язык, на котором был сгенерирован анализ
  audioUrls?: {
    vnd?: string
    np?: string
    summary?: string
  } // Предзагруженные URL аудио для каждой вкладки
}

const STORAGE_KEY = 'virtual-director-analysis-history'

export default function VirtualDirectorPage() {
  const { language } = useLanguage()
  const t = translations[language].virtualDirector
  const [file, setFile] = useState<File | null>(null)
  const [content, setContent] = useState('')
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [activeTab, setActiveTab] = useState<'summary' | 'vnd' | 'np'>('summary')
  const [analysisStep, setAnalysisStep] = useState<'upload' | 'processing' | 'vnd' | 'np' | 'summary' | 'audio-preload' | 'complete'>('upload')
  const [audioPreloadProgress, setAudioPreloadProgress] = useState<PreloadProgress | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | null>(null)
  const [pdfId, setPdfId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [demoMode, setDemoMode] = useState<'real' | 'demo'>('real')
  const [demoData, setDemoData] = useState<any>(null)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  // TTS Hook - используем язык анализа (если есть), иначе язык интерфейса
  const tts = useTTS({
    language: (analysisResult?.language || language) as 'kk' | 'ru' | 'en',
    onError: (error) => {
      console.error('TTS Error:', error)
      alert('Ошибка при генерации озвучки. Попробуйте еще раз.')
    },
  })

  // Get current tab text for TTS
  const currentTabText = useMemo(() => {
    if (!analysisResult) return ''
    
    switch (activeTab) {
      case 'summary':
        return analysisResult.summary || ''
      case 'vnd':
        return analysisResult.vnd || ''
      case 'np':
        return analysisResult.np || ''
      default:
        return ''
    }
  }, [analysisResult, activeTab])

  // Handle TTS button click
  const handleTTSClick = () => {
    console.log('[VND TTS] ==================== TTS BUTTON CLICKED ====================')
    console.log('[VND TTS] 📊 Initial State:', {
      activeTab,
      hasAnalysisResult: !!analysisResult,
      analysisLanguage: analysisResult?.language,
      ttsLanguage: tts.currentLang,
      ttsStatus: tts.status,
      isPlaying: tts.isPlaying,
      isPaused: tts.isPaused,
      isLoading: tts.isLoading,
      isError: tts.isError,
    })

    if (!currentTabText.trim()) {
      console.error('[VND TTS] ❌ No text to speak')
      alert('Нет текста для озвучки')
      return
    }

    console.log('[VND TTS] 📝 Text to speak:', {
      length: currentTabText.length,
      preview: currentTabText.substring(0, 100) + '...',
    })

    // Получаем предзагруженное аудио URL для текущей вкладки
    const preloadedUrl = analysisResult?.audioUrls?.[activeTab]

    console.log('[VND TTS] 🔍 Checking audio source:', {
      hasPreloadedUrl: !!preloadedUrl,
      preloadedUrlPreview: preloadedUrl?.substring(0, 50),
      hasAllAudioUrls: !!analysisResult?.audioUrls,
      audioUrlsKeys: analysisResult?.audioUrls ? Object.keys(analysisResult.audioUrls) : [],
    })

    console.log('[VND TTS] 🎯 TTS State Details:', { 
      status: tts.status,
      isPlaying: tts.isPlaying, 
      isPaused: tts.isPaused,
      isLoading: tts.isLoading,
      isError: tts.isError,
      hasCurrentText: !!tts.currentText,
      currentTextLength: tts.currentText?.length,
      currentTextMatch: tts.currentText === currentTabText,
      activeTab,
    })

    // If playing or paused with different tab, stop and start new
    if ((tts.isPlaying || tts.isPaused) && tts.currentText !== currentTabText) {
      console.log('[VND TTS] 🔄 Switching to different tab audio')
      console.log('[VND TTS] ⏹️ Stopping current audio first')
      tts.stop()
      
      if (preloadedUrl) {
        console.log('[VND TTS] 🎵 Using preloaded audio URL')
        console.log('[VND TTS] 🔗 URL preview:', preloadedUrl.substring(0, 100))
        tts.playFromUrl(preloadedUrl, currentTabText)
      } else {
        console.log('[VND TTS] 🎤 No preloaded URL, generating new audio via TTS API')
        tts.play(currentTabText)
      }
    } else if (tts.isPlaying || tts.isPaused || tts.isLoading) {
      // If already playing/paused/loading same text, just toggle (don't pass text)
      console.log('[VND TTS] ⏯️ Toggling existing audio (pause/resume)')
      console.log('[VND TTS] 📊 Current state before toggle:', {
        isPlaying: tts.isPlaying,
        isPaused: tts.isPaused,
        isLoading: tts.isLoading,
      })
      tts.toggle()
    } else {
      // Idle or error with no audio -> start new
      console.log('[VND TTS] 🆕 Starting new audio (idle/error state)')
      console.log('[VND TTS] 📊 Previous state:', {
        status: tts.status,
        hadCurrentText: !!tts.currentText,
      })
      
      if (preloadedUrl) {
        console.log('[VND TTS] 🎵 Using preloaded audio URL')
        console.log('[VND TTS] 🔗 URL type:', preloadedUrl.startsWith('data:') ? 'Data URI' : preloadedUrl.startsWith('blob:') ? 'Blob URL' : 'Unknown')
        console.log('[VND TTS] 🔗 URL length:', preloadedUrl.length)
        tts.playFromUrl(preloadedUrl, currentTabText)
      } else {
        console.log('[VND TTS] 🎤 No preloaded URL, generating new audio')
        console.log('[VND TTS] 🌐 Language for generation:', analysisResult?.language || language)
        tts.toggle(currentTabText)
      }
    }
    
    console.log('[VND TTS] ==================== END TTS BUTTON CLICK ====================')
  }

  // Stop TTS when tab changes
  useEffect(() => {
    if (tts.isPlaying || tts.isPaused) {
      tts.stop()
    }
  }, [activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

  // Загрузка настроек Virtual Director (режим и демо-данные)
  useEffect(() => {
    const loadSettings = async () => {
      try {
        console.log('[VD] 🔄 Loading settings...')
        const response = await fetch('/api/virtual-director-settings')
        if (response.ok) {
          const data = await response.json()
          setDemoMode(data.mode || 'real')
          setDemoData(data.demoData)
          console.log('[VD] ✅ Settings loaded:', { mode: data.mode, hasDemoData: !!data.demoData })
        }
      } catch (error) {
        console.error('[VD] ❌ Error loading settings:', error)
      } finally {
        setSettingsLoaded(true)
        console.log('[VD] 🏁 Settings loading complete')
      }
    }
    loadSettings()
  }, [])

  // Загрузка сохраненного анализа из localStorage при монтировании компонента
  useEffect(() => {
    const savedAnalysis = localStorage.getItem(STORAGE_KEY)
    if (savedAnalysis) {
      try {
        const parsedAnalysis = JSON.parse(savedAnalysis)
        if (parsedAnalysis.timestamp) {
          parsedAnalysis.timestamp = new Date(parsedAnalysis.timestamp)
        }
        setAnalysisResult(parsedAnalysis)
        setAnalysisStep('complete')
      } catch (error) {
        console.error('Ошибка при загрузке сохраненного анализа:', error)
      }
    }
  }, [])

  // Сохранение результата анализа в localStorage
  useEffect(() => {
    if (analysisResult && analysisStep === 'complete') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(analysisResult))
    }
  }, [analysisResult, analysisStep])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      
      // Читаем содержимое файла для предварительного просмотра
      const readFileContent = async () => {
        if (selectedFile.name.toLowerCase().endsWith('.docx')) {
          try {
            const arrayBuffer = await selectedFile.arrayBuffer()
            const result = await mammoth.extractRawText({ arrayBuffer })
            setContent(result.value)
          } catch (error) {
            console.error('Ошибка при чтении DOCX файла:', error)
            // Fallback to regular text reading
            const reader = new FileReader()
            reader.onload = (event) => {
              setContent(event.target?.result as string || '')
            }
            reader.readAsText(selectedFile)
          }
        } else {
          const reader = new FileReader()
          reader.onload = (event) => {
            setContent(event.target?.result as string || '')
          }
          reader.readAsText(selectedFile)
        }
      }
      
      readFileContent()
    }
  }

  const handleAnalyze = async () => {
    if (!file && !content.trim()) {
      alert(t.upload.fileError)
      return
    }

    // Проверяем что настройки загружены
    if (!settingsLoaded) {
      console.log('[VD] ⏳ Waiting for settings to load...')
      alert(language === 'ru' ? 'Загрузка настроек... Попробуйте снова через секунду.' : 'Loading settings... Try again in a second.')
      return
    }

    console.log('[VD] 🚀 Starting analysis')
    console.log('[VD] 📊 Current state:', {
      demoMode,
      hasDemoData: !!demoData,
      settingsLoaded,
      language
    })

    setAnalysisStep('processing')
    setErrorMessage(null)

    try {
      // ДЕМО РЕЖИМ - используем данные из админки
      if (demoMode === 'demo' && demoData) {
        console.log('[VD] 🎭 Demo mode activated, using demo data')
        console.log('[VD] 📦 Demo data available for languages:', Object.keys(demoData))
        console.log('[VD] 🌐 Current language:', language)
        console.log('[VD] 📝 Language data:', demoData[language] ? 'available' : 'missing')
        
        // Фиктивная задержка для подготовки (2 секунды)
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Преобразуем структуру данных из админки
        // Админка хранит: { finalConclusion: { ru: '...', kk: '...', en: '...' } }
        // Нужно получить: { finalConclusion: '...', agendaItem: '...', ... } для текущего языка
        const langData: any = {}
        
        if (demoData && typeof demoData === 'object') {
          for (const [key, value] of Object.entries(demoData)) {
            if (value && typeof value === 'object' && language in value) {
              langData[key] = (value as any)[language] || (value as any)['ru'] || ''
            } else {
              langData[key] = value
            }
          }
        }
        
        console.log('[VD] 📄 Transformed language data:', Object.keys(langData).length > 0 ? 'found' : 'not found')
        console.log('[VD] 📋 Sample fields:', {
          hasVndKeyFindings: !!langData.vndKeyFindings,
          hasNpaKeyFindings: !!langData.npaKeyFindings,
          hasFinalConclusion: !!langData.finalConclusion,
          vndKeyFindingsLength: langData.vndKeyFindings?.length || 0,
          finalConclusionLength: langData.finalConclusion?.length || 0
        })
        
        setAnalysisStep('vnd')
        await new Promise(resolve => setTimeout(resolve, 2000)) // 2 сек на VND
        
        setAnalysisStep('np')
        await new Promise(resolve => setTimeout(resolve, 2000)) // 2 сек на NP
        
        setAnalysisStep('summary')
        await new Promise(resolve => setTimeout(resolve, 2000)) // 2 сек на Summary
        
        // Получаем переведенные заголовки для текущего языка
        const titles = sectionTitles[language as Language] || sectionTitles.ru
        
        // Формируем результаты из демо-данных в том же формате что и реальный API
        const vndResult = `**${titles.vndKeyFindings}:**
${langData?.vndKeyFindings || 'Нет данных'}

**${titles.vndCompliance}:**
${langData?.vndCompliance || 'Нет данных'}

**${titles.vndViolations}:**
${langData?.vndViolations || 'Нет данных'}

**${titles.vndRisks}:**
${langData?.vndRisks || 'Нет данных'}

**${titles.vndRecommendations}:**
${langData?.vndRecommendations || 'Нет данных'}

**${titles.sources}:**
${langData?.vndSources || 'Нет данных'}`
        
        const npResult = `**${titles.npaKeyFindings}:**
${langData?.npaKeyFindings || 'Нет данных'}

**${titles.npaCompliance}:**
${langData?.npaCompliance || 'Нет данных'}

**${titles.npaViolations}:**
${langData?.npaViolations || 'Нет данных'}

**${titles.npaRisks}:**
${langData?.npaRisks || 'Нет данных'}

**${titles.npaRecommendations}:**
${langData?.npaRecommendations || 'Нет данных'}

**${titles.npaSources}:**
${langData?.npaSources || 'Нет данных'}`
        
        // Используем ключевые слова которые ожидает SummaryView компонент
        const summaryResult = `**${titles.agendaItem}:**
${langData?.agendaItem || 'Нет данных'}

**${titles.decision}:**
${langData?.vote || 'Нет данных'}

**${titles.briefConclusion}:**
${langData?.briefConclusion || 'Нет данных'}

**${titles.reasoning}:**
${langData?.reasoning || 'Нет данных'}

**${titles.finalConclusion}:**
${langData?.finalConclusion || 'Нет данных'}`

        console.log('[VD] 📝 Generated results preview:')
        console.log('[VD]   VND length:', vndResult.length)
        console.log('[VD]   NPA length:', npResult.length)
        console.log('[VD]   Summary length:', summaryResult.length)

        // Загрузка предгенерированного аудио для демо-данных
        console.log('[VD] 🎵 Loading pre-generated audio for demo data...')
        setAnalysisStep('audio-preload')
        
        let audioUrls: any = {}
        
        try {
          // Пытаемся загрузить предгенерированное аудио
          const audioResponse = await fetch(`/api/admin/virtual-director-settings/audio?lang=${language}`)
          
          if (audioResponse.ok) {
            const audioData = await audioResponse.json()
            console.log('[VD] ✅ Pre-generated audio loaded successfully')
            console.log('[VD]   Generated at:', audioData.generatedAt)
            
            // Конвертируем data URIs в blob URLs для совместимости
            const dataURItoBlob = (dataURI: string): Blob => {
              const parts = dataURI.split(',')
              const byteString = atob(parts[1])
              const mimeString = parts[0].split(':')[1].split(';')[0]
              const ab = new ArrayBuffer(byteString.length)
              const ia = new Uint8Array(ab)
              for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i)
              }
              return new Blob([ab], { type: mimeString })
            }
            
            audioUrls = {
              vnd: URL.createObjectURL(dataURItoBlob(audioData.audio.vnd)),
              np: URL.createObjectURL(dataURItoBlob(audioData.audio.np)),
              summary: URL.createObjectURL(dataURItoBlob(audioData.audio.summary))
            }
            
            setAudioPreloadProgress({ current: 3, total: 3, step: 'complete' })
          } else {
            console.warn('[VD] ⚠️ Pre-generated audio not found, generating on-the-fly...')
            // Если аудио не найдено, генерируем на лету как backup
            audioUrls = await preloadTTSAudio(
              {
                vnd: vndResult,
                np: npResult,
                summary: summaryResult
              },
              language as 'kk' | 'ru' | 'en',
              (progress) => {
                console.log('[VD] 🎵 Audio preload progress:', progress)
                setAudioPreloadProgress(progress)
              }
            )
          }
        } catch (error) {
          console.error('[VD] ❌ Error loading pre-generated audio, falling back to generation:', error)
          // Fallback: генерируем на лету
          audioUrls = await preloadTTSAudio(
            {
              vnd: vndResult,
              np: npResult,
              summary: summaryResult
            },
            language as 'kk' | 'ru' | 'en',
            (progress) => {
              console.log('[VD] 🎵 Audio preload progress:', progress)
              setAudioPreloadProgress(progress)
            }
          )
        }

        // Используем дату из настроек или текущую
        const timestamp = demoData.analysisDate 
          ? new Date(demoData.analysisDate) 
          : new Date()

        const analysisWithMetadata = {
          vnd: vndResult,
          np: npResult,
          summary: summaryResult,
          fileName: file?.name || 'анализ',
          timestamp,
          language: language as 'ru' | 'kk' | 'en',
          audioUrls
        }
        setAnalysisResult(analysisWithMetadata)
        setAnalysisStep('complete')
        setAudioPreloadProgress(null)
        return
      }

      // РЕАЛЬНЫЙ РЕЖИМ - обычный анализ через API
      console.log('[VD] 🔬 Real mode activated, calling API')
      let documentText = content.trim().length > 0 ? content : ''
      
      // Если текст пуст и есть файл, читаем его содержимое
      if (!documentText && file) {
        if (file.name.toLowerCase().endsWith('.docx')) {
          try {
            const arrayBuffer = await file.arrayBuffer()
            const result = await mammoth.extractRawText({ arrayBuffer })
            documentText = result.value
          } catch (error) {
            console.error('Ошибка при чтении DOCX файла:', error)
            // Fallback to regular text reading
            documentText = await file.text()
          }
        } else {
          documentText = await file.text()
        }
      }

      if (!documentText.trim()) {
        throw new Error('Не удалось получить содержимое документа для анализа')
      }

      const sendRequest = async (url: string, payload: Record<string, unknown>) => {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })

        const responseText = await response.text()

        let parsed: unknown
        try {
          parsed = JSON.parse(responseText)
        } catch (parseError) {
          throw new Error('Сервер вернул некорректный ответ')
        }

        const { success, result, error } = parsed as {
          success?: boolean
          result?: string
          error?: string
        }

        if (!response.ok || !success || !result) {
          const message = error || `Сервер вернул статус ${response.status}`
          throw new Error(message)
        }

        return result
      }

      setAnalysisStep('vnd')
      const vndResult = await sendRequest('/api/analyze/vnd', { 
        documentContent: documentText,
        language: language // Передаём текущий язык интерфейса
      })

      setAnalysisStep('np')
      const npResult = await sendRequest('/api/analyze/np', { 
        documentContent: documentText,
        language: language // Передаём текущий язык интерфейса
      })

      setAnalysisStep('summary')
      const summaryResult = await sendRequest('/api/analyze/summary', { 
        vndResult, 
        npResult,
        language: language // Передаём текущий язык интерфейса
      })

      // Предзагрузка аудио для всех трёх вкладок
      console.log('[VND] 🎵 Starting audio preload...')
      setAnalysisStep('audio-preload')
      
      const audioUrls = await preloadTTSAudio(
        {
          vnd: vndResult,
          np: npResult,
          summary: summaryResult
        },
        language as 'kk' | 'ru' | 'en',
        (progress) => {
          console.log('[VND] 🎵 Audio preload progress:', progress)
          setAudioPreloadProgress(progress)
        }
      )

      console.log('[VND] ✅ Audio preload complete:', audioUrls)

      const analysisWithMetadata = {
        vnd: vndResult,
        np: npResult,
        summary: summaryResult,
        fileName: file?.name || 'Текстовый ввод',
        timestamp: new Date(),
        language: language as 'ru' | 'kk' | 'en', // Сохраняем язык анализа
        audioUrls // Сохраняем предзагруженные аудио URL
      }
      setAnalysisResult(analysisWithMetadata)
      setAnalysisStep('complete')
      setAudioPreloadProgress(null) // Сбрасываем прогресс
    } catch (error) {
      console.error('Ошибка анализа:', error)
      const message = error instanceof Error ? error.message : 'Произошла ошибка при анализе документа'
      setErrorMessage(message)
      setAnalysisStep('upload')
    }
  }

  // Handle PDF validation/export
  const handleValidate = async () => {
    if (!analysisResult) {
      alert('Нет результатов для валидации')
      return
    }

    setIsValidating(true)
    console.log('[Validate] 📄 Starting PDF generation...')

    try {
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vnd: analysisResult.vnd,
          np: analysisResult.np,
          summary: analysisResult.summary,
          fileName: analysisResult.fileName || 'document',
          language: analysisResult.language || language,
          timestamp: analysisResult.timestamp,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate PDF')
      }

      console.log('[Validate] ✅ PDF generated successfully:', data)
      console.log('[Validate] 🔗 Download URL:', data.downloadUrl)
      console.log('[Validate] 🆔 PDF ID:', data.pdfId)

      // Save download URL and ID to state
      setPdfDownloadUrl(data.downloadUrl)
      setPdfId(data.pdfId)

    } catch (error) {
      console.error('[Validate] ❌ Error:', error)
      alert(
        language === 'ru'
          ? 'Ошибка при создании PDF документа. Попробуйте снова.'
          : language === 'kk'
            ? 'PDF құжатын жасау кезінде қате орын алды. Қайталап көріңіз.'
            : 'Error creating PDF document. Please try again.'
      )
    } finally {
      setIsValidating(false)
    }
  }

  const resetAnalysis = () => {
    setFile(null)
    setContent('')
    setAnalysisResult(null)
    setAnalysisStep('upload')
    setErrorMessage(null)
    setActiveTab('summary')
    setPdfDownloadUrl(null)
    setPdfId(null)
    localStorage.removeItem(STORAGE_KEY)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const clearAnalysisHistory = () => {
    setAnalysisResult(null)
    setAnalysisStep('upload')
    setActiveTab('summary')
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#f8f6f1] dark:bg-[#1a1a1a] pt-16 lg:pt-20">
        <div className="px-6 pb-16 pt-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <motion.header
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="flex w-full items-center justify-between gap-4 rounded-2xl border border-[#e4dfd0] dark:border-[#d7a13a]/30 bg-white dark:bg-[#2a2a2a] px-6 py-5 shadow-sm dark:shadow-[0_25px_80px_-60px_rgba(215,161,58,0.2)]"
            >
              <div className="flex flex-1 flex-col gap-2 text-left min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-semibold leading-tight text-[#2a2a33] dark:text-white sm:text-2xl lg:text-[28px]">
                    {t.title}
                  </h1>
                  {demoMode === 'demo' && (
                    <span className="">
                    </span>
                  )}
                </div>
              </div>
              
              {/* Круглое видео - показывается только при результатах */}
              {analysisStep === 'complete' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="relative w-80 h-32 sm:w-80 sm:h-40 lg:w-80 lg:h-48 rounded-full border-2 border-slate-300 dark:border-[#d7a13a]/50 overflow-hidden flex-shrink-0"
                >
                  <video
                    autoPlay
                    loop
                    muted={true}
                    playsInline
                    aria-hidden="true"
                    className="w-full h-full object-cover"
                  >
                    <source src="/IMG_3363.MOV" type="video/mp4" />
                  </video>
                </motion.div>
              )}
            </motion.header>

            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-red-200 dark:border-[#d7a13a]/50 bg-red-50 dark:bg-[#2a2a2a] px-4 sm:px-6 py-3 sm:py-4 text-sm text-red-700 dark:text-[#d7a13a]"
              >
                {errorMessage}
              </motion.div>
            )}

            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-[#f1d5d5] dark:border-red-800 bg-[#fff5f5] dark:bg-red-900/20 px-4 sm:px-6 py-3 sm:py-4 text-sm text-[#c14949] dark:text-red-300"
              >
                {errorMessage}
              </motion.div>
            )}

            {analysisResult && analysisStep === 'complete' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 rounded-2xl border border-[#ddefe2] dark:border-[#d7a13a]/50 bg-[#f6fbf8] dark:bg-[#2a2a2a] px-4 sm:px-6 py-3 sm:py-4 text-sm text-[#2c6e47] dark:text-[#d7a13a]"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#39a56d] dark:bg-[#d7a13a] flex-shrink-0"></span>
                  <span className="min-w-0">
                    {t.status.saved} {analysisResult.fileName}
                    {analysisResult.timestamp && (
                      <span className="ml-2 text-[#3b8561] dark:text-green-400 block sm:inline">
                        ({analysisResult.timestamp.toLocaleString(language === 'ru' ? 'ru-RU' : language === 'kk' ? 'kk-KZ' : 'en-US')})
                      </span>
                    )}
                  </span>
                </div>
                <button
                  onClick={clearAnalysisHistory}
                  className="text-xs font-medium text-[#c05c5c] dark:text-red-400 transition-colors hover:text-[#a13f3f] dark:hover:text-red-300 flex-shrink-0 self-start sm:self-auto"
                >
                  {t.status.clear}
                </button>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {(analysisStep === 'upload' || analysisStep === 'processing' || analysisStep === 'vnd' || analysisStep === 'np' || analysisStep === 'summary' || analysisStep === 'audio-preload') && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                >
                  {/* Блок загрузки документа */}
                  <motion.section
                    className="rounded-3xl border border-[#e3e6f1] dark:border-[#d7a13a]/30 bg-white dark:bg-[#2a2a2a] p-10 shadow-[0_35px_90px_-70px_rgba(15,23,42,0.65)] dark:shadow-[0_35px_90px_-70px_rgba(215,161,58,0.3)]"
                  >
                    <h2 className="text-center text-2xl font-semibold text-slate-900 dark:text-white">{t.upload.title}</h2>
                    <div className="mt-10 space-y-8">
                      <div className="rounded-2xl border border-dashed border-[#d4d9eb] dark:border-[#d7a13a]/50 bg-[#f9faff] dark:bg-[#333333] px-6 py-10 text-center transition-colors duration-200 hover:border-[#c5cae3] dark:hover:border-[#d7a13a]">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".txt,.doc,.docx"
                          onChange={handleFileChange}
                          className="hidden"
                          id="file-upload"
                        />
                        <label htmlFor="file-upload" className="flex cursor-pointer flex-col items-center gap-4 text-slate-500 dark:text-gray-400">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white dark:bg-[#d7a13a] shadow-[0_15px_45px_-30px_rgba(15,23,42,0.4)] dark:shadow-[0_15px_45px_-30px_rgba(215,161,58,0.4)]">
                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M14 5v14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                              <path d="M7 12l7-7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M23.5 18v3.5A1.5 1.5 0 0 1 22 23h-16a1.5 1.5 0 0 1-1.5-1.5V18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                          </div>
                          <div className="space-y-1">
                            <p className="text-lg font-medium text-slate-700 dark:text-gray-300">{t.upload.clickToUpload}</p>
                            <p className="text-sm text-[#9aa2ba] dark:text-gray-500">{t.upload.supportedFormats}</p>
                          </div>
                        </label>
                        {file && (
                          <div className="mt-6 rounded-2xl border border-[#dce4ff] dark:border-[#d7a13a]/50 bg-[#eef2ff] dark:bg-[#333333] px-4 py-3 text-left text-sm text-[#445089] dark:text-[#d7a13a]">
                            <p className="font-medium">{file.name}</p>
                            <p className="text-xs text-[#707aa6] dark:text-[#d7a13a]/70">{(file.size / 1024).toFixed(2)} KB</p>
                          </div>
                        )}
                      </div>

                      <div className="text-center text-sm font-medium uppercase tracking-[0.4em] text-[#c3c7d7] dark:text-gray-500">{t.upload.orText}</div>

                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-600 dark:text-gray-300">
                          {t.upload.textInputLabel}
                        </label>
                        <textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          className="h-40 w-full resize-none rounded-2xl border border-[#d5d9eb] dark:border-[#d7a13a]/50 bg-[#fdfdff] dark:bg-[#333333] px-4 py-4 text-sm text-slate-700 dark:text-gray-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(215,161,58,0.1)] outline-none transition focus:border-[#c1c7e5] dark:focus:border-[#d7a13a] focus:ring-2 focus:ring-[#e4e7f6] dark:focus:ring-[#d7a13a]/20"
                          placeholder={t.upload.textPlaceholder}
                        />
                      </div>

                      <motion.button
                        onClick={handleAnalyze}
                        disabled={analysisStep !== 'upload'}
                        className={`w-full rounded-2xl px-6 py-3 text-base font-semibold shadow-[0_20px_45px_-30px_rgba(215,161,58,0.85)] transition-all duration-200 ${
                          analysisStep !== 'upload' 
                            ? 'cursor-not-allowed bg-gray-300 text-gray-500' 
                            : 'bg-[#f3d9a6] dark:bg-[#d7a13a] text-[#6c4d1d] dark:text-white hover:-translate-y-0.5 hover:bg-[#eccf97] dark:hover:bg-[#c8921f]'
                        }`}
                        whileHover={analysisStep === 'upload' ? { scale: 1.01 } : {}}
                        whileTap={analysisStep === 'upload' ? { scale: 0.99 } : {}}
                      >
                        {analysisStep === 'upload' ? t.upload.startAnalysis : t.upload.analysisInProgress}
                      </motion.button>
                    </div>
                  </motion.section>

                  {/* Блок процесса анализа документа */}
                  <motion.section
                    className="rounded-3xl border border-[#e3e6f1] dark:border-[#d7a13a]/30 bg-white dark:bg-[#2a2a2a] p-10 shadow-[0_35px_90px_-70px_rgba(15,23,42,0.65)] dark:shadow-[0_35px_90px_-70px_rgba(215,161,58,0.3)]"
                  >
                    <h2 className="text-center text-2xl font-semibold text-slate-900 dark:text-white">{t.analysis.title}</h2>
                    
                    {/* Круговой прогресс-бар */}
                    <div className="mt-2 flex justify-center">
                      <div className="relative">
                        <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 120 120">
                          {/* Фоновый круг */}
                          <circle
                            cx="60"
                            cy="60"
                            r="44"
                            stroke="#e5e7eb"
                            strokeWidth="6"
                            fill="none"
                            className="dark:stroke-gray-600"
                          />
                          {/* Прогресс круг */}
                          <circle
                            cx="60"
                            cy="60"
                            r="44"
                            stroke="#d7a13a"
                            strokeWidth="6"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 44}`}
                            strokeDashoffset={`${2 * Math.PI * 44 * (1 - (
                              analysisStep === 'upload' ? 0 :
                              analysisStep === 'processing' ? 0 :
                              analysisStep === 'vnd' ? 0.25 :
                              analysisStep === 'np' ? 0.5 :
                              analysisStep === 'summary' ? 0.75 :
                              analysisStep === 'audio-preload' ? 0.9 :
                              analysisStep === 'complete' ? 1 : 0
                            ))}`}
                            className="transition-all duration-500 ease-in-out"
                          />
                        </svg>
                        {/* Видео и процент в центре */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="w-[180px] h-[180px] rounded-full overflow-hidden">
                            <video
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="w-full h-full object-cover"
                            >
                              <source src="/789.mp4" type="video/mp4" />
                            </video>
                          </div>
                          {/* Процентный индикатор */}
                          <div className="absolute bottom-4 bg-white/90 dark:bg-[#2a2a2a]/90 backdrop-blur-sm px-3 py-1 rounded-full">
                            <span className="text-lg font-semibold text-[#d7a13a]">
                              {analysisStep === 'upload' ? '0' :
                               analysisStep === 'processing' ? '0' :
                               analysisStep === 'vnd' ? '25' :
                               analysisStep === 'np' ? '50' :
                               analysisStep === 'summary' ? '75' :
                               analysisStep === 'audio-preload' ? '90' :
                               analysisStep === 'complete' ? '100' : '0'}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 space-y-4">
                      <StepRow
                        title={t.analysis.steps.preparation}
                        active={analysisStep === 'processing'}
                        done={analysisStep === 'vnd' || analysisStep === 'np' || analysisStep === 'summary' || analysisStep === 'audio-preload' || analysisStep === 'complete'}
                        idle={analysisStep === 'upload'}
                      />
                      <StepRow
                        title={t.analysis.steps.vnd}
                        active={analysisStep === 'vnd'}
                        done={analysisStep === 'np' || analysisStep === 'summary' || analysisStep === 'audio-preload' || analysisStep === 'complete'}
                        idle={analysisStep === 'upload' || analysisStep === 'processing'}
                      />
                      <StepRow
                        title={t.analysis.steps.np}
                        active={analysisStep === 'np'}
                        done={analysisStep === 'summary' || analysisStep === 'audio-preload' || analysisStep === 'complete'}
                        idle={analysisStep === 'upload' || analysisStep === 'processing' || analysisStep === 'vnd'}
                      />
                      <StepRow
                        title={t.analysis.steps.summary}
                        active={analysisStep === 'summary'}
                        done={analysisStep === 'audio-preload' || analysisStep === 'complete'}
                        idle={analysisStep === 'upload' || analysisStep === 'processing' || analysisStep === 'vnd' || analysisStep === 'np'}
                      />
                      <StepRow
                        title={`🎵 ${t.analysis.steps.audioPreload}`}
                        active={analysisStep === 'audio-preload'}
                        done={analysisStep === 'complete'}
                        idle={analysisStep === 'upload' || analysisStep === 'processing' || analysisStep === 'vnd' || analysisStep === 'np' || analysisStep === 'summary'}
                      />
                    </div>
                  </motion.section>
                </motion.div>
              )}

              {analysisStep === 'complete' && analysisResult && (
                <motion.section
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="rounded-3xl border border-[#e3e6f1] dark:border-[#d7a13a]/30 bg-white dark:bg-[#2a2a2a] p-10 shadow-[0_35px_90px_-70px_rgba(15,23,42,0.65)] dark:shadow-[0_35px_90px_-70px_rgba(215,161,58,0.3)]"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{t.results.title}</h2>
                      <p className="text-sm text-slate-500 dark:text-gray-400">{t.results.subtitle}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {/* TTS Button */}
                      <TTSButton
                        onClick={handleTTSClick}
                        isPlaying={tts.isPlaying}
                        isPaused={tts.isPaused}
                        isLoading={tts.isLoading}
                        isError={tts.isError}
                        language={language}
                      />
                      
                      {/* Validate Button */}
                      <button
                        onClick={handleValidate}
                        disabled={isValidating}
                        className="rounded-xl border border-[#d7a13a]/50 bg-gradient-to-r from-[#d7a13a] to-[#c89030] px-4 py-2 text-sm font-medium text-white transition hover:from-[#c89030] hover:to-[#b98028] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        {isValidating ? t.results.validating : t.results.validate}
                      </button>
                      
                      {/* New Analysis Button */}
                      <button
                        onClick={resetAnalysis}
                        className="rounded-xl border border-[#d5d9eb] dark:border-[#d7a13a]/50 bg-[#f6f7fb] dark:bg-[#333333] px-4 py-2 text-sm font-medium text-slate-700 dark:text-gray-300 transition hover:border-[#c8cce4] dark:hover:border-[#d7a13a] hover:bg-[#eef0fb] dark:hover:bg-[#404040]"
                      >
                        {t.results.newAnalysis}
                      </button>
                    </div>
                  </div>

                  {/* PDF Download Link */}
                  {pdfDownloadUrl && pdfId && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 rounded-2xl border-2 border-[#d7a13a]/30 bg-gradient-to-br from-[#fffbf0] to-[#fff8e6] dark:from-[#2a2520] dark:to-[#2a2318] p-6 shadow-lg"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#d7a13a] to-[#c89030] flex items-center justify-center shadow-md">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                            {language === 'ru' ? '✅ PDF документ готов!' : language === 'kk' ? '✅ PDF құжат дайын!' : '✅ PDF document ready!'}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-gray-400">
                            {language === 'ru' 
                              ? 'Нажмите на кнопку ниже, чтобы скачать документ с результатами анализа и QR-кодом.'
                              : language === 'kk'
                                ? 'Талдау нәтижелері мен QR-коды бар құжатты жүктеу үшін төмендегі батырманы басыңыз.'
                                : 'Click the button below to download the document with analysis results and QR code.'}
                          </p>
                        </div>
                        <div className="flex-shrink-0 w-full sm:w-auto">
                          <a
                            href={pdfDownloadUrl}
                            download={`analysis-${pdfId}.pdf`}
                            onClick={(e) => {
                              console.log('[Download] 🖱️ Click on download button')
                              console.log('[Download] 🔗 URL:', pdfDownloadUrl)
                              console.log('[Download] 🆔 ID:', pdfId)
                            }}
                            className="block w-full sm:w-auto text-center rounded-xl border-2 border-[#d7a13a] bg-gradient-to-r from-[#d7a13a] to-[#c89030] px-6 py-3 text-sm font-semibold text-white transition hover:from-[#c89030] hover:to-[#b98028] hover:shadow-xl active:scale-95"
                          >
                            <span className="flex items-center justify-center gap-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {language === 'ru' ? 'Скачать PDF' : language === 'kk' ? 'PDF жүктеу' : 'Download PDF'}
                            </span>
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="mt-8 border-b border-[#e5e7f2] dark:border-[#d7a13a]/30">
                    <nav className="flex flex-wrap gap-4">
                      {[
                        { id: 'summary' as const, label: t.results.tabs.summary },
                        { id: 'vnd' as const, label: t.results.tabs.vnd },
                        { id: 'np' as const, label: t.results.tabs.np },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`relative pb-3 text-sm font-medium transition-colors ${
                            activeTab === tab.id
                              ? 'text-[#d7a13a]'
                              : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300'
                          }`}
                        >
                          {tab.label}
                          {activeTab === tab.id && (
                            <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#d7a13a]"></span>
                          )}
                        </button>
                      ))}
                    </nav>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.25 }}
                      className="mt-8 space-y-6"
                    >
                      {activeTab === 'summary' && (
                        <SummaryView summary={analysisResult.summary} />
                      )}

                      {activeTab === 'vnd' && (
                        <div className="rounded-2xl border border-[#dbe0f2] dark:border-[#d7a13a]/30 bg-[#f8faff] dark:bg-[#333333] p-6">
                          <MarkdownRender content={analysisResult.vnd || ''} className="text-slate-700 dark:text-gray-300" />
                        </div>
                      )}

                      {activeTab === 'np' && (
                        <div className="rounded-2xl border border-[#e2e5f2] dark:border-[#d7a13a]/30 bg-[#fafbff] dark:bg-[#333333] p-6">
                          <MarkdownRender content={analysisResult.np || ''} className="text-slate-700 dark:text-gray-300" />
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </motion.section>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
    </AuthGuard>
  )
}

function StepRow({
  title,
  active,
  done,
  idle,
}: {
  title: string
  active?: boolean
  done?: boolean
  idle?: boolean
}) {
  const stateClass = done
    ? 'bg-[#e8f8ef] dark:bg-green-900/30 border-[#c8ead8] dark:border-green-700 text-[#317a50] dark:text-green-300'
    : active
      ? 'bg-[#f0f5ff] dark:bg-blue-900/30 border-[#c5d4ff] dark:border-blue-700 text-[#3755a5] dark:text-blue-300'
      : idle
        ? 'bg-[#f7f8fc] dark:bg-gray-800/50 border-[#e5e8f4] dark:border-gray-600 text-[#a1a8c2] dark:text-gray-400'
        : 'bg-[#f9fafe] dark:bg-gray-800/30 border-[#e4e7f5] dark:border-gray-600 text-[#7a819b] dark:text-gray-400'

  return (
    <div className={`flex items-center gap-4 rounded-2xl border px-5 py-4 text-sm font-medium transition ${stateClass}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-gray-700 shadow-[0_10px_25px_-20px_rgba(15,23,42,0.55)] dark:shadow-[0_10px_25px_-20px_rgba(0,0,0,0.3)]">
        {done ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12.5L9.5 17L19 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : active ? (
          <span className="relative inline-flex h-3 w-3 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-40"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-current"></span>
          </span>
        ) : (
          <span className="text-xs font-semibold tracking-wide text-current">•</span>
        )}
      </span>
      <span className="leading-snug text-slate-600 dark:text-gray-300">{title}</span>
    </div>
  )
}

