'use client'

import { useEffect, useRef, useState } from 'react'
import { useLanguage, type Language } from '@/contexts/language-context'

// Конфигурация голосов Azure для каждого языка
const VOICE_CONFIG: Record<Language, { voice: string; xmlLang: string; speechRecognitionLang: string }> = {
  ru: {
    voice: 'ru-RU-SvetlanaNeural',
    xmlLang: 'ru-RU',
    speechRecognitionLang: 'ru-RU'
  },
  kk: {
    voice: 'kk-KZ-AigulNeural',
    xmlLang: 'kk-KZ',
    speechRecognitionLang: 'kk-KZ'
  },
  en: {
    voice: 'en-US-AriaNeural',
    xmlLang: 'en-US',
    speechRecognitionLang: 'en-US'
  }
}

// Языковые инструкции для ассистента
const LANG_INSTRUCTIONS: Record<Language, string> = {
  ru: "[ИНСТРУКЦИЯ: Ответь на РУССКОМ языке. Все запросы к функциям формулируй на русском.]",
  kk: "[НҰСҚАУЛЫҚ: ҚАЗАҚ тілінде жауап беріңіз. Барлық функция сұрауларын орыс тілінде жасаңыз.]",
  en: "[INSTRUCTION: Respond in ENGLISH language. Formulate all function queries in Russian language.]"
}

// Приветствия на разных языках
const GREETINGS: Record<Language, string> = {
  ru: "Здравствуйте! Я виртуальный ассистент. Чем могу помочь?",
  kk: "Сәлеметсіз бе! Мен виртуалды ассистентпін. Қалай көмектесе аламын?",
  en: "Hello! I am a virtual assistant. How can I help you?"
}

// Локализация UI
const UI_TEXT: Record<Language, {
  title: string
  videoTitle: string
  connected: string
  connecting: string
  notConnected: string
  loadingSdk: string
  notConnectedLabel: string
  startButton: string
  stopButton: string
  dialogTitle: string
  speaking: string
  listening: string
  microphoneButton: string
  sendButton: string
  inputPlaceholder: string
  avatarConnected: string
  speechRecognitionFailed: string
  requestError: string
  noAnswer: string
}> = {
  ru: {
    title: "🤖 AI Аватар - JIbek",
    videoTitle: "Видео аватар",
    connected: "🟢 Подключен",
    connecting: "🟡 Подключение...",
    notConnected: "⚪ Не подключен",
    loadingSdk: "Загрузка SDK...",
    notConnectedLabel: "Аватар не подключен",
    startButton: "🚀 Запустить аватар",
    stopButton: "⏹️ Остановить",
    dialogTitle: "Диалог",
    speaking: "🎙️ Говорю...",
    listening: "Слушаю...",
    microphoneButton: "🎙️ Микрофон",
    sendButton: "Отправить",
    inputPlaceholder: "Введите ваш вопрос...",
    avatarConnected: "Аватар подключен! Задайте вопрос.",
    speechRecognitionFailed: "Не удалось распознать речь, попробуйте снова.",
    requestError: "Ошибка при обработке запроса",
    noAnswer: "Не удалось получить ответ"
  },
  kk: {
    title: "🤖 AI Аватар - JIbek",
    videoTitle: "Бейне аватар",
    connected: "🟢 Қосылды",
    connecting: "🟡 Қосылуда...",
    notConnected: "⚪ Қосылмаған",
    loadingSdk: "SDK жүктелуде...",
    notConnectedLabel: "Аватар қосылмаған",
    startButton: "🚀 Аватарды іске қосу",
    stopButton: "⏹️ Тоқтату",
    dialogTitle: "Диалог",
    speaking: "🎙️ Айтып жатырмын...",
    listening: "Тыңдап жатырмын...",
    microphoneButton: "🎙️ Микрофон",
    sendButton: "Жіберу",
    inputPlaceholder: "Сұрағыңызды енгізіңіз...",
    avatarConnected: "Аватар қосылды! Сұрақ қойыңыз.",
    speechRecognitionFailed: "Сөзді тану мүмкін болмады, қайталап көріңіз.",
    requestError: "Сұрауды өңдеу кезінде қате",
    noAnswer: "Жауап алу мүмкін болмады"
  },
  en: {
    title: "🤖 AI Avatar - JIbek",
    videoTitle: "Video avatar",
    connected: "🟢 Connected",
    connecting: "🟡 Connecting...",
    notConnected: "⚪ Not connected",
    loadingSdk: "Loading SDK...",
    notConnectedLabel: "Avatar not connected",
    startButton: "🚀 Start avatar",
    stopButton: "⏹️ Stop",
    dialogTitle: "Dialog",
    speaking: "🎙️ Speaking...",
    listening: "Listening...",
    microphoneButton: "🎙️ Microphone",
    sendButton: "Send",
    inputPlaceholder: "Enter your question...",
    avatarConnected: "Avatar connected! Ask a question.",
    speechRecognitionFailed: "Failed to recognize speech, please try again.",
    requestError: "Error processing request",
    noAnswer: "Failed to get answer"
  }
}

export default function AvatarPage() {
  // Языковой контекст - используем глобальный язык из навигации
  const { language } = useLanguage()

  const [isInitialized, setIsInitialized] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userInput, setUserInput] = useState('')
  const [messages, setMessages] = useState<Array<{role: string, text: string}>>([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [listeningText, setListeningText] = useState('')
  const [azureConfig, setAzureConfig] = useState<{key: string, region: string} | null>(null)

  // Получаем текущую локализацию на основе глобального языка
  const t = UI_TEXT[language]

  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const avatarSynthesizerRef = useRef<any>(null)

  // Загрузка Azure конфигурации
  useEffect(() => {
    fetch('/api/azure-speech-config')
      .then(res => res.json())
      .then(config => {
        setAzureConfig(config)
        console.log('✅ Azure config loaded')
      })
      .catch(err => {
        console.error('❌ Failed to load Azure config:', err)
        setError('Failed to load Azure configuration')
      })
  }, [])

  // Загрузка Azure Speech SDK
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://aka.ms/csspeech/jsbrowserpackageraw'
    script.async = true
    script.onload = () => {
      console.log('✅ Azure Speech SDK loaded')
      setIsInitialized(true)
    }
    script.onerror = () => {
      setError('Failed to load Azure Speech SDK')
    }
    document.body.appendChild(script)

    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
      }
      if (avatarSynthesizerRef.current) {
        avatarSynthesizerRef.current.close()
      }
    }
  }, [])

  const connectAvatar = async () => {
    if (!isInitialized) {
      setError('SDK not initialized')
      return
    }

    if (!azureConfig) {
      setError('Azure configuration not loaded')
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      const SpeechSDK = (window as any).SpeechSDK
      
      // Конфигурация Azure Speech из безопасного API
      const cogSvcRegion = azureConfig.region
      const cogSvcSubKey = azureConfig.key
      
      const speechSynthesisConfig = SpeechSDK.SpeechConfig.fromSubscription(cogSvcSubKey, cogSvcRegion)
      
      // Настройка аватара - используем простой аватар "lisa"
      const avatarConfig = new SpeechSDK.AvatarConfig('lisa', 'casual-sitting')
      avatarConfig.customized = false
      
      avatarSynthesizerRef.current = new SpeechSDK.AvatarSynthesizer(speechSynthesisConfig, avatarConfig)
      
      console.log('🎤 Avatar synthesizer created')
      
      // Получаем WebRTC токен
      const response = await fetch(
        `https://${cogSvcRegion}.tts.speech.microsoft.com/cognitiveservices/avatar/relay/token/v1`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': cogSvcSubKey
          }
        }
      )
      
      if (!response.ok) {
        throw new Error(`Failed to get token: ${response.status}`)
      }
      
      const tokenData = await response.json()
      
      // Настройка WebRTC
      const peerConnection = new RTCPeerConnection({
        iceServers: [{
          urls: tokenData.Urls,
          username: tokenData.Username,
          credential: tokenData.Password
        }]
      })

      peerConnectionRef.current = peerConnection

      // Явно запрашиваем аудио/видео каналы у Azure, иначе поток не приходит
      peerConnection.addTransceiver('video', { direction: 'sendrecv' })
      peerConnection.addTransceiver('audio', { direction: 'sendrecv' })

      // Создаём служебный data channel и слушаем события сервера (субтитры, idle и т.п.)
      const clientEventChannel = peerConnection.createDataChannel('clientEvent')
      clientEventChannel.onmessage = (event) => {
        console.log('📨 Avatar client event:', event.data)
      }

      peerConnection.addEventListener('datachannel', (event) => {
        const channel = event.channel
        channel.onmessage = (e) => {
          console.log('📡 Avatar server event:', e.data)
        }
      })

      // Обработка видео и аудио потоков
      peerConnection.ontrack = (event) => {
        console.log('📡 Track received:', event.track.kind)

        if (event.track.kind === 'video' && videoRef.current) {
          videoRef.current.srcObject = event.streams[0]
          videoRef.current.autoplay = true
          videoRef.current.playsInline = true
          console.log('🎥 Video connected')
        }
        
        if (event.track.kind === 'audio' && audioRef.current) {
          audioRef.current.srcObject = event.streams[0]
          audioRef.current.autoplay = true
          console.log('🔊 Audio connected')
        }
      }

      peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', peerConnection.iceConnectionState)
        const state = peerConnection.iceConnectionState

        if (state === 'connected' || state === 'completed') {
          setIsConnected(true)
          setIsConnecting(false)
          setMessages((prev) => prev.length > 0 ? prev : [{ role: 'system', text: t.avatarConnected }])
        } else if (state === 'failed') {
          setIsConnecting(false)
          setIsConnected(false)
          setError('WebRTC connection failed. Проверьте ключ и регион Azure Speech.')
        } else if (state === 'disconnected' || state === 'closed') {
          setIsConnecting(false)
          setIsConnected(false)
        }
      }

      // Запускаем аватар
      const startResult = await avatarSynthesizerRef.current.startAvatarAsync(peerConnection)
      if (startResult.reason !== SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
        if (startResult.reason === SpeechSDK.ResultReason.Canceled) {
          const cancellation = SpeechSDK.CancellationDetails.fromResult(startResult)
          throw new Error(cancellation.errorDetails || 'Avatar start canceled')
        }
        throw new Error('Avatar failed to start')
      }
      console.log('✅ Avatar started', startResult.resultId)
      
      // Приветствие на выбранном языке
      setIsSpeaking(true)
      const voiceConfig = VOICE_CONFIG[language]
      const greeting = GREETINGS[language]
      
      const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="${voiceConfig.xmlLang}">
        <voice name="${voiceConfig.voice}">
          <mstts:leadingsilence-exact value="0"/>
          <prosody rate="0%" pitch="0%">
            ${greeting}
          </prosody>
        </voice>
      </speak>`
      
      console.log(`👋 Greeting with voice: ${voiceConfig.voice}, Language: ${language}`)
      
      const greetingResult = await avatarSynthesizerRef.current.speakSsmlAsync(ssml)
      if (greetingResult.reason !== SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
        if (greetingResult.reason === SpeechSDK.ResultReason.Canceled) {
          const cancellation = SpeechSDK.CancellationDetails.fromResult(greetingResult)
          console.error('Greeting canceled:', cancellation.errorDetails)
        } else {
          console.error('Greeting failed with reason:', greetingResult.reason)
        }
      }
      setIsSpeaking(false)
      
    } catch (err: any) {
      console.error('❌ Connection error:', err)
      setError(err.message)
      setIsConnecting(false)
      setIsSpeaking(false)
    }
  }

  const speak = async (text: string) => {
    if (!avatarSynthesizerRef.current || !isConnected) {
      console.error('Avatar not connected')
      return
    }
    
    setIsSpeaking(true)
    
    const SpeechSDK = (window as any).SpeechSDK
    const voiceConfig = VOICE_CONFIG[language]
    
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="${voiceConfig.xmlLang}">
      <voice name="${voiceConfig.voice}">
        <mstts:leadingsilence-exact value="0"/>
        <prosody rate="0%" pitch="0%">
          ${text}
        </prosody>
      </voice>
    </speak>`
    
    console.log(`🔊 Speaking with voice: ${voiceConfig.voice}, Language: ${language}`)
    
    try {
      const speechResult = await avatarSynthesizerRef.current.speakSsmlAsync(ssml)
      if (speechResult.reason !== SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
        if (speechResult.reason === SpeechSDK.ResultReason.Canceled) {
          const cancellation = SpeechSDK.CancellationDetails.fromResult(speechResult)
          console.error('Speech canceled:', cancellation.errorDetails)
        } else {
          console.error('Speech failed with reason:', speechResult.reason)
        }
      }
      setIsSpeaking(false)
    } catch (err) {
      console.error('Speech error:', err)
      setIsSpeaking(false)
    }
  }

  const sendQuestion = async (question: string) => {
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion) return

    const userMessage = { role: 'user', text: trimmedQuestion }
    setMessages(prev => [...prev, userMessage])

    try {
      // Добавляем языковую инструкцию к запросу
      const languageInstruction = LANG_INSTRUCTIONS[language]
      const messageWithLanguage = `${languageInstruction}\n\n${trimmedQuestion}`
      
      console.log('🌐 Запрос к /api/assistant')
      console.log('📦 Payload:', { function_name: 'db_query', arguments: { message: messageWithLanguage } })
      console.log('🌍 Язык аватара:', language)

      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function_name: 'db_query',
          arguments: { message: messageWithLanguage }
        })
      })

      console.log('📥 Response status:', response.status)

      const data = await response.json()
      console.log('📊 Response data:', data)

      const answer = data.result || t.noAnswer

      const assistantMessage = { role: 'assistant', text: answer }
      setMessages(prev => [...prev, assistantMessage])

      // Озвучиваем ответ
      if (isConnected) {
        await speak(answer)
      }
    } catch (err) {
      console.error('Error:', err)
      const errorMsg = { role: 'system', text: t.requestError }
      setMessages(prev => [...prev, errorMsg])
    }
  }

  const startSpeechRecognition = async () => {
    if (!isInitialized) {
      setError('SDK not initialized')
      return
    }

    if (!azureConfig) {
      setError('Azure configuration not loaded')
      return
    }

    const SpeechSDK = (window as any).SpeechSDK
    if (!SpeechSDK) {
      setError('Azure Speech SDK не загружен')
      return
    }

    try {
      setIsListening(true)
      setListeningText(t.listening)

      const voiceConfig = VOICE_CONFIG[language]
      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(azureConfig.key, azureConfig.region)
      speechConfig.speechRecognitionLanguage = voiceConfig.speechRecognitionLang
      
      console.log('🎤 Starting speech recognition with language:', voiceConfig.speechRecognitionLang)
      
      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput()
      const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig)

      recognizer.recognizeOnceAsync(
        async (result: any) => {
          recognizer.close()
          setIsListening(false)
          setListeningText('')

          if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
            const recognizedText = result.text.trim()
            console.log('📝 Recognized text:', recognizedText)
            if (recognizedText) {
              await sendQuestion(recognizedText)
            } else {
              setMessages(prev => [...prev, { role: 'system', text: t.speechRecognitionFailed }])
            }
          } else if (result.reason === SpeechSDK.ResultReason.NoMatch) {
            console.warn('Speech recognition: No match')
            setMessages(prev => [...prev, { role: 'system', text: t.speechRecognitionFailed }])
          }
        },
        (err: any) => {
          recognizer.close()
          console.error('Speech recognition error:', err)
          setIsListening(false)
          setListeningText('')
          setMessages(prev => [...prev, { role: 'system', text: t.speechRecognitionFailed }])
        }
      )
    } catch (err: any) {
      console.error('Speech recognition failed:', err)
      setIsListening(false)
      setListeningText('')
      setError(err.message || 'Speech recognition failed')
    }
  }

  const handleSendMessage = async () => {
    if (!userInput.trim()) return
    
    console.log('📤 Отправка сообщения:', userInput)
    const question = userInput
    setUserInput('')
    await sendQuestion(question)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          {t.title}
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Левая часть - Аватар */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-700">{t.videoTitle}</h2>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isConnected ? 'bg-green-100 text-green-700' : 
                  isConnecting ? 'bg-yellow-100 text-yellow-700' : 
                  'bg-gray-100 text-gray-600'
                }`}>
                  {isConnected ? t.connected : isConnecting ? t.connecting : t.notConnected}
                </div>
              </div>
              
              <div className="relative bg-gray-900 rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                <video 
                  ref={videoRef} 
                  className="w-full h-full object-cover"
                  playsInline
                />
                <audio ref={audioRef} />
                
                {!isConnected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="text-center text-white">
                      {!isInitialized ? (
                        <div className="animate-pulse">{t.loadingSdk}</div>
                      ) : error ? (
                        <div className="text-red-400">{error}</div>
                      ) : (
                        <div className="text-gray-300">{t.notConnectedLabel}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex gap-3">
                {!isConnected ? (
                  <button
                    onClick={connectAvatar}
                    disabled={!isInitialized || isConnecting}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isConnecting ? t.connecting : t.startButton}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (avatarSynthesizerRef.current) {
                        avatarSynthesizerRef.current.close()
                      }
                      if (peerConnectionRef.current) {
                        peerConnectionRef.current.close()
                      }
                      setIsConnected(false)
                      setMessages([])
                    }}
                    className="flex-1 bg-red-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-600 transition-all"
                  >
                    {t.stopButton}
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Правая часть - Чат */}
          <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">{t.dialogTitle}</h2>
            
            <div className="flex-1 overflow-y-auto mb-4 space-y-3 min-h-[400px] max-h-[500px]">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-blue-500 text-white ml-auto max-w-[80%]' 
                      : msg.role === 'assistant'
                      ? 'bg-gray-100 text-gray-800 mr-auto max-w-[80%]'
                      : 'bg-yellow-50 text-yellow-800 text-center'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              {isSpeaking && (
                <div className="text-center text-gray-500 italic">
                  {t.speaking}
                </div>
              )}
              {isListening && (
                <div className="text-center text-purple-500 italic">
                  {listeningText}
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={t.inputPlaceholder}
                disabled={!isConnected}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                onClick={startSpeechRecognition}
                disabled={!isConnected || isListening || isSpeaking}
                className="bg-white border-2 border-purple-200 text-purple-600 px-4 py-3 rounded-xl font-medium hover:border-purple-400 hover:text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isListening ? t.listening : t.microphoneButton}
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!isConnected || !userInput.trim()}
                className="bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {t.sendButton}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
