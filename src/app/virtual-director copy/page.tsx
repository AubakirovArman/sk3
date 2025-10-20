'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { AuthGuard } from '@/components/auth-guard'
import * as mammoth from 'mammoth'
import MarkdownRender from '@/components/markdown-render'
import { SummaryView } from './summary-view'

import { MOCK_SUMMARY, MOCK_VND, MOCK_NP } from './mock-data'

interface AnalysisResult {
  vnd: string
  np: string
  summary: string
  fileName?: string
  timestamp?: Date
}

const STORAGE_KEY = 'virtual-director-analysis-history'
const STEP_DELAY_MS = 1000

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export default function VirtualDirectorPage() {
  const [file, setFile] = useState<File | null>(null)
  const [content, setContent] = useState('')
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [activeTab, setActiveTab] = useState<'summary' | 'vnd' | 'np'>('summary')
  const [analysisStep, setAnalysisStep] = useState<'upload' | 'processing' | 'vnd' | 'np' | 'summary' | 'complete'>('upload')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioItogRef = useRef<HTMLAudioElement | null>(null)
  const audioVndRef = useRef<HTMLAudioElement | null>(null)
  const audioNpaRef = useRef<HTMLAudioElement | null>(null)
  const videoHeaderRef = useRef<HTMLVideoElement | null>(null)
  const audioItogPlayedRef = useRef<boolean>(false)
  const audioVndPlayedRef = useRef<boolean>(false)
  const audioNpaPlayedRef = useRef<boolean>(false)

  // Загрузка сохраненного анализа из localStorage при монтировании компонента
  useEffect(() => {
    const savedAnalysis = localStorage.getItem(STORAGE_KEY)
    if (savedAnalysis) {
      try {
        const parsedAnalysis = JSON.parse(savedAnalysis) as Partial<AnalysisResult>
        const timestampValue = parsedAnalysis.timestamp ? new Date(parsedAnalysis.timestamp) : undefined
        setAnalysisResult({
          vnd: parsedAnalysis.vnd ?? MOCK_VND,
          np: parsedAnalysis.np ?? MOCK_NP,
          summary: parsedAnalysis.summary ?? MOCK_SUMMARY,
          fileName: parsedAnalysis.fileName,
          timestamp: timestampValue,
        })
        setAnalysisStep('complete')
        // Отмечаем что аудио уже было воспроизведено (при загрузке из localStorage не воспроизводим)
        audioItogPlayedRef.current = true
        audioVndPlayedRef.current = true
        audioNpaPlayedRef.current = true
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

  // Воспроизведение аудио "Итоговое заключение" (только один раз)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (audioItogRef.current) {
          audioItogRef.current.pause()
          audioItogRef.current.currentTime = 0
        }
        if (audioVndRef.current) {
          audioVndRef.current.pause()
          audioVndRef.current.currentTime = 0
        }
        if (audioNpaRef.current) {
          audioNpaRef.current.pause()
          audioNpaRef.current.currentTime = 0
        }
      }
    }

    const handleBeforeUnload = () => {
      if (audioItogRef.current) {
        audioItogRef.current.pause()
        audioItogRef.current.currentTime = 0
      }
      if (audioVndRef.current) {
        audioVndRef.current.pause()
        audioVndRef.current.currentTime = 0
      }
      if (audioNpaRef.current) {
        audioNpaRef.current.pause()
        audioNpaRef.current.currentTime = 0
      }
    }

    // Воспроизводим аудио только если анализ завершен, активна вкладка summary и аудио еще не воспроизводилось
    if (analysisStep === 'complete' && activeTab === 'summary' && !audioItogPlayedRef.current) {
      // Создаем аудио элемент если еще не создан
      if (!audioItogRef.current) {
        audioItogRef.current = new Audio('/itog.wav')
      }

      // Воспроизводим через 1 секунду
      timeoutId = setTimeout(() => {
        audioItogRef.current?.play().catch((error) => {
          console.error('Ошибка воспроизведения аудио:', error)
        })
        // Отмечаем что аудио было воспроизведено
        audioItogPlayedRef.current = true
      }, 1000)

      // Добавляем слушатели событий
      document.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('beforeunload', handleBeforeUnload)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [analysisStep, activeTab])

  // Воспроизведение аудио "Анализ ВНД" (только один раз)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    if (analysisStep === 'complete' && activeTab === 'vnd' && !audioVndPlayedRef.current) {
      if (!audioVndRef.current) {
        audioVndRef.current = new Audio('/VND.wav')
      }

      timeoutId = setTimeout(() => {
        audioVndRef.current?.play().catch((error) => {
          console.error('Ошибка воспроизведения VND аудио:', error)
        })
        audioVndPlayedRef.current = true
      }, 1000)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [analysisStep, activeTab])

  // Воспроизведение аудио "Анализ НПА" (только один раз)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    if (analysisStep === 'complete' && activeTab === 'np' && !audioNpaPlayedRef.current) {
      if (!audioNpaRef.current) {
        audioNpaRef.current = new Audio('/npa.wav')
      }

      timeoutId = setTimeout(() => {
        audioNpaRef.current?.play().catch((error) => {
          console.error('Ошибка воспроизведения НПА аудио:', error)
        })
        audioNpaPlayedRef.current = true
      }, 1000)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [analysisStep, activeTab])

  // Остановка всех аудио и видео при смене вкладки
  useEffect(() => {
    if (activeTab !== 'summary' && audioItogRef.current) {
      audioItogRef.current.pause()
      audioItogRef.current.currentTime = 0
    }
    if (activeTab !== 'vnd' && audioVndRef.current) {
      audioVndRef.current.pause()
      audioVndRef.current.currentTime = 0
    }
    if (activeTab !== 'np' && audioNpaRef.current) {
      audioNpaRef.current.pause()
      audioNpaRef.current.currentTime = 0
    }
    
    // Остановка видео при ВОЗВРАТЕ на вкладку "Итоговое заключение"
    if (activeTab === 'summary' && videoHeaderRef.current) {
      videoHeaderRef.current.pause()
    }
  }, [activeTab])

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
    if (!file && !content.trim()) return;
    
    setErrorMessage(null)
    setAnalysisStep('processing')

    try {
      await wait(STEP_DELAY_MS)
      setAnalysisStep('vnd')

      await wait(STEP_DELAY_MS)
      setAnalysisStep('np')

      await wait(STEP_DELAY_MS)
      setAnalysisStep('summary')

      await wait(STEP_DELAY_MS)
      
      // После завершения анализа переходим к результатам
      setAnalysisStep('complete')
      const analysisWithMetadata: AnalysisResult = {
        vnd: MOCK_VND,
        np: MOCK_NP,
        summary: MOCK_SUMMARY,
        fileName: file?.name || (content.trim() ? 'Текстовый ввод' : 'Демонстрационный режим'),
        timestamp: new Date(),
      }

      setAnalysisResult(analysisWithMetadata)
    } catch (error) {
      console.error('Ошибка анализа:', error)
      const message = error instanceof Error ? error.message : 'Произошла ошибка при анализе документа'
      setErrorMessage(message)
      setAnalysisStep('upload')
    }
  }

  const resetAnalysis = () => {
    setFile(null)
    setContent('')
    setAnalysisResult(null)
    setAnalysisStep('upload')
    setErrorMessage(null)
    setActiveTab('summary')
    localStorage.removeItem(STORAGE_KEY)
    
    // Останавливаем и сбрасываем все аудио
    if (audioItogRef.current) {
      audioItogRef.current.pause()
      audioItogRef.current.currentTime = 0
    }
    if (audioVndRef.current) {
      audioVndRef.current.pause()
      audioVndRef.current.currentTime = 0
    }
    if (audioNpaRef.current) {
      audioNpaRef.current.pause()
      audioNpaRef.current.currentTime = 0
    }
    
    // Сбрасываем флаги воспроизведения аудио для нового анализа
    audioItogPlayedRef.current = false
    audioVndPlayedRef.current = false
    audioNpaPlayedRef.current = false
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const clearAnalysisHistory = () => {
    setAnalysisResult(null)
    setAnalysisStep('upload')
    setActiveTab('summary')
    localStorage.removeItem(STORAGE_KEY)
    
    // Останавливаем и сбрасываем все аудио
    if (audioItogRef.current) {
      audioItogRef.current.pause()
      audioItogRef.current.currentTime = 0
    }
    if (audioVndRef.current) {
      audioVndRef.current.pause()
      audioVndRef.current.currentTime = 0
    }
    if (audioNpaRef.current) {
      audioNpaRef.current.pause()
      audioNpaRef.current.currentTime = 0
    }
    
    // Сбрасываем флаги воспроизведения
    audioItogPlayedRef.current = false
    audioVndPlayedRef.current = false
    audioNpaPlayedRef.current = false
  }

  return (
    <AuthGuard>
      <main className="min-h-screen">
        <div className="px-6 pb-16 pt-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <motion.header
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="flex w-full items-center justify-between gap-4 rounded-2xl border border-[#e4dfd0] bg-white px-6 py-5 shadow-sm"
            >
              <div className="flex flex-1 flex-col gap-1 text-left min-w-0">
                <h1 className="text-xl font-semibold leading-tight text-[#2a2a33] sm:text-2xl lg:text-[28px]">
                  Виртуальный член Совета Директоров
                </h1>
              </div>
              
              {/* Круглое видео - показывается только при результатах */}
              {analysisStep === 'complete' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="relative w-80 h-32 sm:w-80 sm:h-40 lg:w-80 lg:h-48 rounded-full border-2 border-slate-300 overflow-hidden flex-shrink-0"
                >
                  <video
                    ref={videoHeaderRef}
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
                className="rounded-2xl border border-[#f1d5d5] bg-[#fff5f5] px-6 py-4 text-sm text-[#c14949]"
              >
                {errorMessage}
              </motion.div>
            )}

            {analysisResult && analysisStep === 'complete' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#ddefe2] bg-[#f6fbf8] px-6 py-4 text-sm text-[#2c6e47]"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#39a56d]"></span>
                  <span>
                    Сохранен анализ: {analysisResult.fileName}
                  </span>
                </div>
                <button
                  onClick={clearAnalysisHistory}
                  className="text-xs font-medium text-[#c05c5c] transition-colors hover:text-[#a13f3f]"
                >
                  Очистить
                </button>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {(analysisStep === 'upload' || analysisStep === 'processing' || analysisStep === 'vnd' || analysisStep === 'np' || analysisStep === 'summary') && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                >
                  {/* Блок загрузки документа */}
                  <motion.section
                    className="rounded-3xl border border-[#e3e6f1] bg-white p-10 shadow-[0_35px_90px_-70px_rgba(15,23,42,0.65)]"
                  >
                    <h2 className="text-center text-2xl font-semibold text-slate-900">Загрузка документа для анализа</h2>
                    <div className="mt-10 space-y-8">
                      <div className="rounded-2xl border border-dashed border-[#d4d9eb] bg-[#f9faff] px-6 py-10 text-center transition-colors duration-200 hover:border-[#c5cae3]">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".txt,.doc,.docx"
                          onChange={handleFileChange}
                          className="hidden"
                          id="file-upload"
                        />
                        <label htmlFor="file-upload" className="flex cursor-pointer flex-col items-center gap-4 text-slate-500">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_15px_45px_-30px_rgba(15,23,42,0.4)]">
                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M14 5v14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                              <path d="M7 12l7-7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M23.5 18v3.5A1.5 1.5 0 0 1 22 23h-16a1.5 1.5 0 0 1-1.5-1.5V18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                          </div>
                          <div className="space-y-1">
                            <p className="text-lg font-medium text-slate-700">Нажмите для загрузки файла</p>
                            <p className="text-sm text-[#9aa2ba]">Поддерживаются форматы: TXT, DOC, DOCX</p>
                          </div>
                        </label>
                        {file && (
                          <div className="mt-6 rounded-2xl border border-[#dce4ff] bg-[#eef2ff] px-4 py-3 text-left text-sm text-[#445089]">
                            <p className="font-medium">{file.name}</p>
                            <p className="text-xs text-[#707aa6]">{(file.size / 1024).toFixed(2)} KB</p>
                          </div>
                        )}
                      </div>

                      <div className="text-center text-sm font-medium uppercase tracking-[0.4em] text-[#c3c7d7]">или</div>

                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-600">
                          Введите текст документа:
                        </label>
                        <textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          className="h-40 w-full resize-none rounded-2xl border border-[#d5d9eb] bg-[#fdfdff] px-4 py-4 text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none transition focus:border-[#c1c7e5] focus:ring-2 focus:ring-[#e4e7f6]"
                          placeholder="Введите название темы и пояснительную записку..."
                        />
                      </div>

                      <motion.button
                        onClick={handleAnalyze}
                        disabled={analysisStep !== 'upload'}
                        className={`w-full rounded-2xl px-6 py-3 text-base font-semibold shadow-[0_20px_45px_-30px_rgba(215,161,58,0.85)] transition-all duration-200 ${
                          analysisStep !== 'upload' 
                            ? 'cursor-not-allowed bg-gray-300 text-gray-500' 
                            : 'bg-[#f3d9a6] text-[#6c4d1d] hover:-translate-y-0.5 hover:bg-[#eccf97]'
                        }`}
                        whileHover={analysisStep === 'upload' ? { scale: 1.01 } : {}}
                        whileTap={analysisStep === 'upload' ? { scale: 0.99 } : {}}
                      >
                        {analysisStep === 'upload' ? 'Начать анализ' : 'Анализ в процессе...'}
                      </motion.button>
                      
                      {analysisStep === 'summary' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4"
                        >
                          <motion.button
                            onClick={() => setAnalysisStep('complete')}
                            className="w-full rounded-2xl bg-[#d7a13a] px-6 py-3 text-base font-semibold text-white shadow-[0_20px_45px_-30px_rgba(215,161,58,0.85)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#c8932e]"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                          >
                            Перейти к результатам
                          </motion.button>
                        </motion.div>
                      )}
                    </div>
                  </motion.section>

                  {/* Блок процесса анализа документа */}
                  <motion.section
                    className="rounded-3xl border border-[#e3e6f1] bg-white p-10 shadow-[0_35px_90px_-70px_rgba(15,23,42,0.65)]"
                  >
                    <h2 className="text-center text-2xl font-semibold text-slate-900">Процесс анализа документа</h2>
                    
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
                            strokeDasharray={`${2 * Math.PI * 54}`}
                            strokeDashoffset={`${2 * Math.PI * 54 * (1 - (
                              analysisStep === 'upload' ? 0 :
                              analysisStep === 'processing' ? 0.25 :
                              analysisStep === 'vnd' ? 0.5 :
                              analysisStep === 'np' ? 0.75 :
                              analysisStep === 'summary' ? 1 : 0
                            ))}`}
                            className="transition-all duration-500 ease-in-out"
                          />
                        </svg>
                        {/* Видео в центре */}
                        <div className="absolute inset-0 flex items-center justify-center">
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
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 space-y-4">
                      <StepRow
                        title="Подготовка к анализу"
                        active={analysisStep === 'processing'}
                        done={analysisStep === 'vnd' || analysisStep === 'np' || analysisStep === 'summary'}
                        idle={analysisStep === 'upload'}
                      />
                      <StepRow
                        title="Анализ ВНД (Внутренние нормативные документы)"
                        active={analysisStep === 'vnd'}
                        done={analysisStep === 'np' || analysisStep === 'summary'}
                        idle={analysisStep === 'upload' || analysisStep === 'processing'}
                      />
                      <StepRow
                        title="Анализ НПА (Нормативные правовые акты)"
                        active={analysisStep === 'np'}
                        done={analysisStep === 'summary'}
                        idle={analysisStep === 'upload' || analysisStep === 'processing' || analysisStep === 'vnd'}
                      />
                      <StepRow
                        title="Формирование итогового заключения"
                        active={analysisStep === 'summary'}
                        done={false}
                        idle={analysisStep === 'upload' || analysisStep === 'processing' || analysisStep === 'vnd' || analysisStep === 'np'}
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
                  className="rounded-3xl border border-[#e3e6f1] bg-white p-10 shadow-[0_35px_90px_-70px_rgba(15,23,42,0.65)]"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-900">Результаты анализа</h2>
                      <p className="text-sm text-slate-500">Выберите вкладку, чтобы посмотреть детали.</p>
                    </div>
                    <button
                      onClick={resetAnalysis}
                      className="self-start rounded-xl border border-[#d5d9eb] bg-[#f6f7fb] px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#c8cce4] hover:bg-[#eef0fb]"
                    >
                      Новый анализ
                    </button>
                  </div>

                  <div className="mt-8 border-b border-[#e5e7f2]">
                    <nav className="flex flex-wrap gap-4">
                      {[
                        { id: 'summary' as const, label: 'Итоговое заключение' },
                        { id: 'vnd' as const, label: 'Анализ ВНД' },
                        { id: 'np' as const, label: 'Анализ НПА' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`relative pb-3 text-sm font-medium transition-colors ${
                            activeTab === tab.id
                              ? 'text-[#d7a13a]'
                              : 'text-slate-400 hover:text-slate-600'
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
                        <div className="rounded-2xl border border-[#dbe0f2] bg-[#f8faff] p-6">
                          <MarkdownRender content={analysisResult.vnd || ''} />
                        </div>
                      )}

                      {activeTab === 'np' && (
                        <div className="rounded-2xl border border-[#e2e5f2] bg-[#fafbff] p-6">
                          <MarkdownRender content={analysisResult.np || ''} />
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
    ? 'bg-[#e8f8ef] border-[#c8ead8] text-[#317a50]'
    : active
      ? 'bg-[#f0f5ff] border-[#c5d4ff] text-[#3755a5]'
      : idle
        ? 'bg-[#f7f8fc] border-[#e5e8f4] text-[#a1a8c2]'
        : 'bg-[#f9fafe] border-[#e4e7f5] text-[#7a819b]'

  return (
    <div className={`flex items-center gap-4 rounded-2xl border px-5 py-4 text-sm font-medium transition ${stateClass}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-[0_10px_25px_-20px_rgba(15,23,42,0.55)]">
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
      <span className="leading-snug text-slate-600">{title}</span>
    </div>
  )
}

