'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/auth-guard'
import { useLanguage } from '@/contexts/language-context'
import { motion } from 'framer-motion'

interface FAQ {
  id: string
  questionRu: string
  questionKk: string | null
  questionEn: string | null
  answerRu: string
  answerKk: string | null
  answerEn: string | null
  videoUrl: string | null
  similarQuestions: string[]
  isActive: boolean
  priority: number
  createdAt: string
  updatedAt: string
}

type Language = 'ru' | 'kk' | 'en'

export default function DialogFAQAdminPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null)
  const [generatingSimilar, setGeneratingSimilar] = useState(false)

  // Форма
  const [formData, setFormData] = useState({
    questionRu: '',
    questionKk: '',
    questionEn: '',
    answerRu: '',
    answerKk: '',
    answerEn: '',
    videoUrl: '',
    similarQuestions: [] as string[],
    isActive: true,
    priority: 0
  })

  const [newSimilarQuestion, setNewSimilarQuestion] = useState('')
  const [selectedLanguageForGeneration, setSelectedLanguageForGeneration] = useState<Language>('ru')
  const [uploadingVideo, setUploadingVideo] = useState(false)

  useEffect(() => {
    loadFAQs()
  }, [])

  const loadFAQs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/dialog-faq')
      const data = await response.json()

      if (data.success) {
        setFaqs(data.faqs)
      }
    } catch (error) {
      console.error('Error loading FAQs:', error)
      alert('Ошибка при загрузке FAQ')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingFAQ
        ? `/api/admin/dialog-faq/${editingFAQ.id}`
        : '/api/admin/dialog-faq'
      
      const method = editingFAQ ? 'PUT' : 'POST'

      console.log('[FAQ Admin] Submitting data:', formData)

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        alert(editingFAQ ? 'FAQ обновлен' : 'FAQ создан')
        resetForm()
        loadFAQs()
      } else {
        alert(`Ошибка: ${data.error}`)
      }
    } catch (error) {
      console.error('Error saving FAQ:', error)
      alert('Ошибка при сохранении FAQ')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот FAQ?')) return

    try {
      const response = await fetch(`/api/admin/dialog-faq/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        alert('FAQ удален')
        loadFAQs()
      } else {
        alert(`Ошибка: ${data.error}`)
      }
    } catch (error) {
      console.error('Error deleting FAQ:', error)
      alert('Ошибка при удалении FAQ')
    }
  }

  const handleEdit = (faq: FAQ) => {
    setEditingFAQ(faq)
    setFormData({
      questionRu: faq.questionRu,
      questionKk: faq.questionKk || '',
      questionEn: faq.questionEn || '',
      answerRu: faq.answerRu,
      answerKk: faq.answerKk || '',
      answerEn: faq.answerEn || '',
      videoUrl: faq.videoUrl || '',
      similarQuestions: faq.similarQuestions || [],
      isActive: faq.isActive,
      priority: faq.priority
    })
    setIsFormOpen(true)
  }

  const resetForm = () => {
    setEditingFAQ(null)
    setFormData({
      questionRu: '',
      questionKk: '',
      questionEn: '',
      answerRu: '',
      answerKk: '',
      answerEn: '',
      videoUrl: '',
      similarQuestions: [],
      isActive: true,
      priority: 0
    })
    setIsFormOpen(false)
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Проверка типа файла
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm']
    if (!allowedTypes.includes(file.type)) {
      alert('Неподдерживаемый формат видео. Используйте MP4, MOV или WebM')
      return
    }

    // Проверка размера (50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('Файл слишком большой. Максимальный размер 50MB')
      return
    }

    try {
      setUploadingVideo(true)
      const formDataUpload = new FormData()
      formDataUpload.append('video', file)

      const response = await fetch('/api/upload/video', {
        method: 'POST',
        body: formDataUpload,
      })

      const data = await response.json()

      if (data.success) {
        setFormData(prev => ({ ...prev, videoUrl: data.videoUrl }))
        alert('Видео успешно загружено')
      } else {
        alert(`Ошибка загрузки: ${data.error}`)
      }
    } catch (error) {
      console.error('Error uploading video:', error)
      alert('Ошибка при загрузке видео')
    } finally {
      setUploadingVideo(false)
    }
  }

  const handleRemoveVideo = () => {
    setFormData(prev => ({ ...prev, videoUrl: '' }))
  }

  const handleGenerateSimilar = async () => {
    const question = formData[`question${selectedLanguageForGeneration.charAt(0).toUpperCase() + selectedLanguageForGeneration.slice(1)}` as keyof typeof formData]
    
    if (!question || typeof question !== 'string') {
      alert('Введите вопрос на выбранном языке')
      return
    }

    try {
      setGeneratingSimilar(true)
      const response = await fetch('/api/admin/dialog-faq/generate-similar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          language: selectedLanguageForGeneration,
          count: 5
        })
      })

      const data = await response.json()

      if (data.success) {
        setFormData(prev => ({
          ...prev,
          similarQuestions: [
            ...prev.similarQuestions,
            ...data.similarQuestions
          ]
        }))
        alert(`Сгенерировано ${data.similarQuestions.length} похожих вопросов`)
      } else {
        alert(`Ошибка: ${data.error}`)
      }
    } catch (error) {
      console.error('Error generating similar questions:', error)
      alert('Ошибка при генерации похожих вопросов')
    } finally {
      setGeneratingSimilar(false)
    }
  }

  const addSimilarQuestion = () => {
    if (!newSimilarQuestion.trim()) return

    setFormData(prev => ({
      ...prev,
      similarQuestions: [...prev.similarQuestions, newSimilarQuestion.trim()]
    }))
    setNewSimilarQuestion('')
  }

  const removeSimilarQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      similarQuestions: prev.similarQuestions.filter((_, i) => i !== index)
    }))
  }

  return (
    <AuthGuard>
      <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Заголовок */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Управление FAQ диалога
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Добавляйте вопросы-ответы для обучения чата SKAI
              </p>
            </div>
            <button
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="px-6 py-3 bg-[#d7a13a] text-white rounded-lg hover:bg-[#c18c28] transition"
            >
              {isFormOpen ? 'Отмена' : '+ Добавить FAQ'}
            </button>
          </div>

          {/* Форма добавления/редактирования */}
          {isFormOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 bg-white dark:bg-[#1f1f1f] rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {editingFAQ ? 'Редактировать FAQ' : 'Новый FAQ'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Вопросы на всех языках */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Вопрос (Русский) *
                    </label>
                    <input
                      type="text"
                      value={formData.questionRu}
                      onChange={(e) => setFormData({ ...formData, questionRu: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#2c2c2c] text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Вопрос (Қазақша)
                    </label>
                    <input
                      type="text"
                      value={formData.questionKk}
                      onChange={(e) => setFormData({ ...formData, questionKk: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#2c2c2c] text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Question (English)
                    </label>
                    <input
                      type="text"
                      value={formData.questionEn}
                      onChange={(e) => setFormData({ ...formData, questionEn: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#2c2c2c] text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Ответы на всех языках */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ответ (Русский) *
                    </label>
                    <textarea
                      value={formData.answerRu}
                      onChange={(e) => setFormData({ ...formData, answerRu: e.target.value })}
                      required
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#2c2c2c] text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ответ (Қазақша)
                    </label>
                    <textarea
                      value={formData.answerKk}
                      onChange={(e) => setFormData({ ...formData, answerKk: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#2c2c2c] text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Answer (English)
                    </label>
                    <textarea
                      value={formData.answerEn}
                      onChange={(e) => setFormData({ ...formData, answerEn: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#2c2c2c] text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Видео для озвучки */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Видео для воспроизведения при озвучке
                  </label>
                  <div className="space-y-3">
                    {formData.videoUrl ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#2c2c2c] rounded-lg">
                          <video 
                            src={formData.videoUrl} 
                            className="w-32 h-24 object-cover rounded"
                            controls
                          />
                          <div className="flex-1">
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-mono break-all">
                              {formData.videoUrl}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveVideo}
                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            Удалить
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Это видео будет воспроизводиться при озвучке ответа на данный вопрос
                        </p>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          accept="video/mp4,video/quicktime,video/webm"
                          onChange={handleVideoUpload}
                          disabled={uploadingVideo}
                          className="block w-full text-sm text-gray-500 dark:text-gray-400
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-lg file:border-0
                            file:text-sm file:font-medium
                            file:bg-[#d7a13a] file:text-white
                            hover:file:bg-[#c18c28]
                            file:cursor-pointer
                            disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        {uploadingVideo && (
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            ⏳ Загрузка видео...
                          </p>
                        )}
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Форматы: MP4, MOV, WebM. Максимум 50MB. Если не указать, будет использоваться видео по умолчанию (IMG_3709.MOV)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Похожие вопросы */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Похожие вопросы (для распознавания)
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedLanguageForGeneration}
                        onChange={(e) => setSelectedLanguageForGeneration(e.target.value as Language)}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#2c2c2c] text-gray-900 dark:text-white"
                      >
                        <option value="ru">Русский</option>
                        <option value="kk">Қазақша</option>
                        <option value="en">English</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleGenerateSimilar}
                        disabled={generatingSimilar}
                        className="px-4 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                      >
                        {generatingSimilar ? '⏳' : '✨'} Сгенерировать
                      </button>
                    </div>
                  </div>

                  {/* Список похожих вопросов */}
                  {formData.similarQuestions.length > 0 && (
                    <div className="mb-2 space-y-1">
                      {formData.similarQuestions.map((q, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <span className="flex-1 px-3 py-1 bg-gray-100 dark:bg-[#2c2c2c] rounded">
                            {q}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSimilarQuestion(index)}
                            className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Добавить похожий вопрос вручную */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSimilarQuestion}
                      onChange={(e) => setNewSimilarQuestion(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSimilarQuestion())}
                      placeholder="Добавить похожий вопрос вручную..."
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#2c2c2c] text-gray-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={addSimilarQuestion}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                    >
                      + Добавить
                    </button>
                  </div>
                </div>

                {/* Настройки */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Активен
                      </span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Приоритет
                    </label>
                    <input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#2c2c2c] text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Кнопки */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#d7a13a] text-white rounded-lg hover:bg-[#c18c28] transition"
                  >
                    {editingFAQ ? 'Сохранить изменения' : 'Создать FAQ'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Список FAQ */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-[#d7a13a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Загрузка...</p>
              </div>
            ) : faqs.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-[#1f1f1f] rounded-2xl border-2 border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400">FAQ пока нет</p>
              </div>
            ) : (
              faqs.map((faq) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white dark:bg-[#1f1f1f] rounded-2xl border-2 ${
                    faq.isActive
                      ? 'border-green-200 dark:border-green-800'
                      : 'border-gray-200 dark:border-gray-700 opacity-60'
                  } p-6`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {faq.questionRu}
                        </h3>
                        {faq.priority > 0 && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded">
                            Приоритет: {faq.priority}
                          </span>
                        )}
                        {!faq.isActive && (
                          <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                            Неактивен
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {faq.answerRu}
                      </p>
                      {faq.similarQuestions.length > 0 && (
                        <details className="mt-2">
                          <summary className="text-sm text-gray-500 dark:text-gray-500 cursor-pointer hover:text-[#d7a13a]">
                            Похожие вопросы ({faq.similarQuestions.length})
                          </summary>
                          <ul className="mt-2 space-y-1 ml-4">
                            {faq.similarQuestions.map((q, i) => (
                              <li key={i} className="text-sm text-gray-600 dark:text-gray-400">
                                • {q}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(faq)}
                        className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete(faq.id)}
                        className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
