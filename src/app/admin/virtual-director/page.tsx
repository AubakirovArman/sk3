'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/auth-guard'
import { motion } from 'framer-motion'
import Link from 'next/link'

type Mode = 'real' | 'demo'

interface DemoData {
  // Дата и время анализа
  analysisDate?: string  // ISO string формат для datetime-local
  
  // Результаты анализа
  finalConclusion: { ru: string; kk: string; en: string }
  agendaItem: { ru: string; kk: string; en: string }
  vote: { ru: string; kk: string; en: string }
  briefConclusion: { ru: string; kk: string; en: string }
  reasoning: { ru: string; kk: string; en: string }
  
  // Анализ ВНД
  vndKeyFindings: { ru: string; kk: string; en: string }
  vndCompliance: { ru: string; kk: string; en: string }
  vndViolations: { ru: string; kk: string; en: string }
  vndRisks: { ru: string; kk: string; en: string }
  vndRecommendations: { ru: string; kk: string; en: string }
  vndSources: { ru: string; kk: string; en: string }
  
  // Анализ НПА
  npaKeyFindings: { ru: string; kk: string; en: string }
  npaCompliance: { ru: string; kk: string; en: string }
  npaViolations: { ru: string; kk: string; en: string }
  npaRisks: { ru: string; kk: string; en: string }
  npaRecommendations: { ru: string; kk: string; en: string }
  npaSources: { ru: string; kk: string; en: string }
}

// Тип для мультиязычных полей (без analysisDate)
type MultilingualField = Exclude<keyof DemoData, 'analysisDate'>

// Компонент TextField вынесен наружу чтобы избежать потери фокуса
const TextField = ({ 
  label, 
  field,
  demoData,
  updateField,
  multiline = false 
}: { 
  label: string
  field: MultilingualField
  demoData: DemoData
  updateField: (field: MultilingualField, lang: 'ru' | 'kk' | 'en', value: string) => void
  multiline?: boolean 
}) => (
  <div className="mb-6">
    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{label}</h4>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {(['ru', 'kk', 'en'] as const).map((lang) => (
        <div key={lang}>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {lang === 'ru' ? 'Русский' : lang === 'kk' ? 'Қазақша' : 'English'}
          </label>
          {multiline ? (
            <textarea
              value={demoData[field][lang]}
              onChange={(e) => updateField(field, lang, e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#2c2c2c] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d7a13a]"
            />
          ) : (
            <input
              type="text"
              value={demoData[field][lang]}
              onChange={(e) => updateField(field, lang, e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#2c2c2c] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d7a13a]"
            />
          )}
        </div>
      ))}
    </div>
  </div>
)

export default function VirtualDirectorSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('real')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'results' | 'vnd' | 'npa'>('results')
  const [generatingAudio, setGeneratingAudio] = useState(false)
  
  const [demoData, setDemoData] = useState<DemoData>({
    finalConclusion: { ru: '', kk: '', en: '' },
    agendaItem: { ru: '', kk: '', en: '' },
    vote: { ru: '', kk: '', en: '' },
    briefConclusion: { ru: '', kk: '', en: '' },
    reasoning: { ru: '', kk: '', en: '' },
    vndKeyFindings: { ru: '', kk: '', en: '' },
    vndCompliance: { ru: '', kk: '', en: '' },
    vndViolations: { ru: '', kk: '', en: '' },
    vndRisks: { ru: '', kk: '', en: '' },
    vndRecommendations: { ru: '', kk: '', en: '' },
    vndSources: { ru: '', kk: '', en: '' },
    npaKeyFindings: { ru: '', kk: '', en: '' },
    npaCompliance: { ru: '', kk: '', en: '' },
    npaViolations: { ru: '', kk: '', en: '' },
    npaRisks: { ru: '', kk: '', en: '' },
    npaRecommendations: { ru: '', kk: '', en: '' },
    npaSources: { ru: '', kk: '', en: '' },
  })

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.role !== 'admin') {
      router.push('/dialog')
    }
  }, [session, status, router])

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/virtual-director-settings')
      if (response.ok) {
        const data = await response.json()
        if (data.mode) setMode(data.mode)
        if (data.demoData) setDemoData(data.demoData)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/virtual-director-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, demoData })
      })

      if (response.ok) {
        alert('Настройки успешно сохранены!')
      } else {
        alert('Ошибка при сохранении настроек')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Ошибка при сохранении настроек')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateAudio = async () => {
    if (!confirm(`Сгенерировать озвучку для всех языков (RU, KK, EN)? Это может занять 2-3 минуты.`)) {
      return
    }

    setGeneratingAudio(true)
    try {
      const response = await fetch('/api/admin/virtual-director-settings/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const data = await response.json()
        const totalSize = (
          (data.sizes.ru.vnd + data.sizes.ru.np + data.sizes.ru.summary +
           data.sizes.kk.vnd + data.sizes.kk.np + data.sizes.kk.summary +
           data.sizes.en.vnd + data.sizes.en.np + data.sizes.en.summary) / 1024
        ).toFixed(0)
        alert(`Озвучка успешно сгенерирована для всех языков!\n\nОбщий размер: ${totalSize} KB\n\n🇷🇺 Русский: ${((data.sizes.ru.vnd + data.sizes.ru.np + data.sizes.ru.summary) / 1024).toFixed(0)} KB\n🇰🇿 Қазақ: ${((data.sizes.kk.vnd + data.sizes.kk.np + data.sizes.kk.summary) / 1024).toFixed(0)} KB\n🇬🇧 English: ${((data.sizes.en.vnd + data.sizes.en.np + data.sizes.en.summary) / 1024).toFixed(0)} KB`)
      } else {
        const error = await response.json()
        if (error.instructions) {
          // Показываем детальные инструкции
          alert(`${error.message}\n\n${error.instructions.join('\n')}`)
        } else {
          alert(`Ошибка при генерации озвучки:\n${error.message || error.error || error.details}`)
        }
      }
    } catch (error) {
      console.error('Failed to generate audio:', error)
      alert('Ошибка при генерации озвучки')
    } finally {
      setGeneratingAudio(false)
    }
  }

  const updateField = (field: MultilingualField, lang: 'ru' | 'kk' | 'en', value: string) => {
    setDemoData(prev => {
      const fieldValue = prev[field] as { ru: string; kk: string; en: string }
      return {
        ...prev,
        [field]: { ...fieldValue, [lang]: value }
      }
    })
  }

  const updateDateField = (value: string) => {
    setDemoData(prev => ({
      ...prev,
      analysisDate: value
    }))
  }

  if (status === 'loading' || loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-[#d7a13a] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AuthGuard>
    )
  }

  if ((session?.user as any)?.role !== 'admin') {
    return null
  }

  return (
    <AuthGuard>
      <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <Link 
            href="/admin" 
            className="text-sm text-[#d7a13a] hover:underline mb-4 inline-block"
          >
            ← Назад в админ-панель
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Режим Virtual Director
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Настройка режима работы страницы /virtual-director
          </p>
        </motion.div>

        {/* Выбор режима */}
        <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Режим работы
          </h2>
          
          <div className="flex gap-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                value="real"
                checked={mode === 'real'}
                onChange={(e) => setMode(e.target.value as Mode)}
                className="w-4 h-4 text-[#d7a13a] focus:ring-[#d7a13a]"
              />
              <span className="text-gray-900 dark:text-white">
                Реальный режим (работа с API)
              </span>
            </label>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                value="demo"
                checked={mode === 'demo'}
                onChange={(e) => setMode(e.target.value as Mode)}
                className="w-4 h-4 text-[#d7a13a] focus:ring-[#d7a13a]"
              />
              <span className="text-gray-900 dark:text-white">
                Режим показа (демо-данные)
              </span>
            </label>
          </div>
        </div>

        {/* Демо-данные (показывается только в режиме показа) */}
        {mode === 'demo' && (
          <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Настройка демо-данных
            </h2>

            {/* Дата и время анализа */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Дата и время анализа
              </label>
              <input
                type="datetime-local"
                value={demoData.analysisDate || new Date().toISOString().slice(0, 16)}
                onChange={(e) => updateDateField(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-[#2a2a2a] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d7a13a] focus:border-transparent"
              />
            </div>

            {/* Табы */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
              <button
                onClick={() => setActiveTab('results')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'results'
                    ? 'border-b-2 border-[#d7a13a] text-[#d7a13a]'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Результаты анализа
              </button>
              <button
                onClick={() => setActiveTab('vnd')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'vnd'
                    ? 'border-b-2 border-[#d7a13a] text-[#d7a13a]'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Анализ ВНД
              </button>
              <button
                onClick={() => setActiveTab('npa')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'npa'
                    ? 'border-b-2 border-[#d7a13a] text-[#d7a13a]'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Анализ НПА
              </button>
            </div>

            {/* Результаты анализа */}
            {activeTab === 'results' && (
              <div>
                <TextField label="Итоговое заключение" field="finalConclusion" demoData={demoData} updateField={updateField} multiline />
                <TextField label="Пункт повестки дня" field="agendaItem" demoData={demoData} updateField={updateField} />
                <TextField label="Голосую" field="vote" demoData={demoData} updateField={updateField} />
                <TextField label="Краткое заключение" field="briefConclusion" demoData={demoData} updateField={updateField} multiline />
                <TextField label="Обоснование" field="reasoning" demoData={demoData} updateField={updateField} multiline />
              </div>
            )}

            {/* Анализ ВНД */}
            {activeTab === 'vnd' && (
              <div>
                <TextField label="ВНД: КЛЮЧЕВЫЕ ВЫВОДЫ" field="vndKeyFindings" demoData={demoData} updateField={updateField} multiline />
                <TextField label="ВНД: СООТВЕТСТВИЯ" field="vndCompliance" demoData={demoData} updateField={updateField} multiline />
                <TextField label="ВНД: НАРУШЕНИЯ" field="vndViolations" demoData={demoData} updateField={updateField} multiline />
                <TextField label="ВНД: РИСКИ" field="vndRisks" demoData={demoData} updateField={updateField} multiline />
                <TextField label="ВНД: РЕКОМЕНДАЦИИ" field="vndRecommendations" demoData={demoData} updateField={updateField} multiline />
                <TextField label="ИСТОЧНИКИ" field="vndSources" demoData={demoData} updateField={updateField} multiline />
              </div>
            )}

            {/* Анализ НПА */}
            {activeTab === 'npa' && (
              <div>
                <TextField label="НПА: КЛЮЧЕВЫЕ ВЫВОДЫ" field="npaKeyFindings" demoData={demoData} updateField={updateField} multiline />
                <TextField label="НПА: СООТВЕТСТВИЯ" field="npaCompliance" demoData={demoData} updateField={updateField} multiline />
                <TextField label="НПА: НАРУШЕНИЯ / РИСК НЕСОБЛЮДЕНИЯ" field="npaViolations" demoData={demoData} updateField={updateField} multiline />
                <TextField label="НПА: ПРАВОВЫЕ РИСКИ" field="npaRisks" demoData={demoData} updateField={updateField} multiline />
                <TextField label="НПА: РЕКОМЕНДАЦИИ ПО СООТВЕТСТВИЮ" field="npaRecommendations" demoData={demoData} updateField={updateField} multiline />
                <TextField label="ИСТОЧНИКИ НПА" field="npaSources" demoData={demoData} updateField={updateField} multiline />
              </div>
            )}
          </div>
        )}

        {/* Кнопки действий */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* Генерация озвучки (только в демо режиме) */}
          {mode === 'demo' && (
            <button
              onClick={handleGenerateAudio}
              disabled={generatingAudio}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {generatingAudio ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Генерация озвучки...
                </>
              ) : (
                <>
                  🎤 Озвучить все языки (RU/KK/EN)
                </>
              )}
            </button>
          )}
          
          {/* Кнопка сохранения */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-[#d7a13a] text-white rounded-lg hover:bg-[#c18c28] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Сохранение...' : 'Сохранить настройки'}
          </button>
        </div>
      </div>
    </AuthGuard>
  )
}
