'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthGuard } from '@/components/auth-guard'
import { useLanguage } from '@/contexts/language-context'
import { translations } from '@/locales'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

const STORAGE_KEY = 'vnd-chat-history'

export default function VNDPage() {
  const { language } = useLanguage()
  const t = translations[language].chat.vnd
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: t.welcome,
      isUser: false,
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Функция для автоматического изменения высоты textarea
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto'
    const scrollHeight = textarea.scrollHeight
    const lineHeight = 24 // примерная высота одной строки
    const maxHeight = lineHeight * 7 // максимум 7 строк
    
    if (scrollHeight <= maxHeight) {
      textarea.style.height = scrollHeight + 'px'
    } else {
      textarea.style.height = maxHeight + 'px'
    }
  }

  // Обработчик изменения текста в textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value)
    adjustTextareaHeight(e.target)
  }

  // Загрузка истории чата из localStorage при монтировании компонента
  useEffect(() => {
    const savedMessages = localStorage.getItem(STORAGE_KEY)
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
        setMessages(parsedMessages)
      } catch (error) {
        console.error('Ошибка при загрузке истории чата:', error)
      }
    }
  }, [])

  // Сохранение истории чата в localStorage при изменении сообщений
  useEffect(() => {
    if (messages.length > 1) { // Сохраняем только если есть сообщения кроме приветственного
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    }
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const inputText = inputMessage.trim()
    setInputMessage('')
    setIsLoading(true)

    // Сбрасываем высоту textarea после отправки
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    // Добавляем сообщение пользователя
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    // Создаем пустое сообщение бота для streaming
    const botMessageId = (Date.now() + 1).toString()
    const botMessage: Message = {
      id: botMessageId,
      text: '',
      isUser: false,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, botMessage])

    try {
      const response = await fetch('/api/vnd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputText }),
      })

      if (!response.ok) {
        throw new Error('Ошибка сети')
      }

      const data = await response.json()
      
      // Обновляем сообщение бота с полученным ответом
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId 
          ? { ...msg, text: data.response || 'Получен пустой ответ' }
          : msg
      ))

    } catch (error) {
      // Обновляем сообщение бота с ошибкой
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId 
          ? { ...msg, text: 'Извините, произошла ошибка. Попробуйте еще раз.' }
          : msg
      ))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearChatHistory = () => {
    const initialMessage = {
      id: '1',
      text: 'Добро пожаловать в чат-бот по внутренним нормативным документам! Я помогу вам найти информацию по регламентам, процедурам и политикам компании. Задайте ваш вопрос.',
      isUser: false,
      timestamp: new Date()
    }
    setMessages([initialMessage])
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <AuthGuard>
      <div className="h-screen flex flex-col pt-16 lg:pt-20">
        {/* Заголовок */}
        <motion.div
          className="flex-shrink-0 px-4 sm:px-6 py-4 sm:py-7 bg-white dark:bg-[#2a2a2a] border-b border-gray-100 dark:border-[#d7a13a]/30 shadow-sm dark:shadow-[0_1px_3px_rgba(215,161,58,0.1)]"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.h1 
            className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-[#d7a13a] mb-1 sm:mb-2 text-left"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {t.title}
          </motion.h1>
          <motion.p 
            className="text-sm sm:text-base text-gray-600 dark:text-[#d7a13a]/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {t.subtitle}
          </motion.p>
        </motion.div>

        {/* Область сообщений */}
        <motion.div 
          className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gray-50 dark:bg-[#1a1a1a]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className="max-w-6xl mx-auto px-4 lg:px-8">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`mb-3 sm:mb-4 flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-lg ${
                      message.isUser
                        ? 'bg-[#d7a13a] text-white shadow-lg'
                        : 'bg-white dark:bg-[#333333] text-gray-800 dark:text-gray-100 shadow-md border border-[#CEAD6E]/20 dark:border-[#d7a13a]/30'
                    }`}
                  >
                    <p className="text-sm sm:text-base whitespace-pre-wrap leading-relaxed">{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.isUser ? 'text-white/70' : 'text-gray-500 dark:text-[#d7a13a]/60'
                    }`}>
                      {message.timestamp.toLocaleTimeString('ru-RU', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start mb-3 sm:mb-4"
              >
                <div className="bg-white dark:bg-[#333333] text-gray-800 dark:text-gray-100 shadow-md border dark:border-[#d7a13a]/30 max-w-[85%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 dark:bg-[#d7a13a] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 dark:bg-[#d7a13a] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 dark:bg-[#d7a13a] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-[#d7a13a]/70">Печатает...</span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </motion.div>

        {/* Поле ввода - закреплено снизу */}
        <motion.div 
          className="flex-shrink-0 p-3 sm:p-4 bg-white dark:bg-[#2a2a2a] border-t border-gray-100 dark:border-[#d7a13a]/30 safe-area-inset-bottom shadow-sm dark:shadow-[0_-1px_3px_rgba(215,161,58,0.1)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <div className="max-w-6xl mx-auto px-4 lg:px-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500 dark:text-[#d7a13a]/70">
                {messages.length > 1 ? t.historySaved : t.newChat}
              </span>
              {messages.length > 1 && (
                <button
                  onClick={clearChatHistory}
                  className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                >
                  {t.clearHistory}
                </button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={t.placeholder}
                className="flex-1 p-3 border border-[#CEAD6E]/30 dark:border-[#d7a13a]/50 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#d7a13a] focus:border-transparent overflow-y-auto text-base bg-white dark:bg-[#333333] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-[#d7a13a]/50"
                rows={1}
                disabled={isLoading}
                style={{ minHeight: '48px', maxHeight: '168px' }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="w-full sm:w-auto px-6 py-3 bg-[#d7a13a] text-white rounded-lg hover:bg-[#d7a13a]/90 focus:outline-none focus:ring-2 focus:ring-[#d7a13a] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[48px] flex items-center justify-center shadow-lg"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span className="font-medium">{t.send}</span>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AuthGuard>
  )
}