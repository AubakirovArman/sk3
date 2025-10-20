/**
 * TTS Audio Preloader
 * Generates audio for all tabs in parallel during document analysis
 */

import { ttsClient } from './tts-client'
import { prepareTextForTTS } from './text-sanitizer'

export interface PreloadResult {
  vnd?: string
  np?: string
  summary?: string
  errors?: {
    vnd?: Error
    np?: Error
    summary?: Error
  }
}

export interface PreloadProgress {
  current: number
  total: number
  step: 'vnd' | 'np' | 'summary' | 'complete'
}

/**
 * Preload TTS audio for all three tabs
 * @param texts - Object with text for each tab
 * @param lang - Language for TTS (kk, ru, or en)
 * @param onProgress - Callback for progress updates
 * @returns Object with audio URLs for each tab
 */
export async function preloadTTSAudio(
  texts: {
    vnd: string
    np: string
    summary: string
  },
  lang: 'kk' | 'ru' | 'en',
  onProgress?: (progress: PreloadProgress) => void
): Promise<PreloadResult> {
  console.log('[TTS Preloader] 🎬 Starting preload for 3 tabs')
  console.log('[TTS Preloader] 🌐 Language:', lang)

  const result: PreloadResult = {
    errors: {}
  }

  // Подготовка текстов (очистка от Markdown)
  const cleanedTexts = {
    vnd: prepareTextForTTS(texts.vnd, 5000),
    np: prepareTextForTTS(texts.np, 5000),
    summary: prepareTextForTTS(texts.summary, 5000)
  }

  console.log('[TTS Preloader] 🧹 Cleaned text lengths:', {
    vnd: cleanedTexts.vnd.length,
    np: cleanedTexts.np.length,
    summary: cleanedTexts.summary.length
  })

  // Генерируем аудио параллельно для всех трёх вкладок
  const promises = [
    // VND
    (async () => {
      try {
        onProgress?.({ current: 1, total: 3, step: 'vnd' })
        console.log('[TTS Preloader] 🎤 Generating VND audio...')
        result.vnd = await ttsClient.generateSpeechURL(cleanedTexts.vnd, lang)
        console.log('[TTS Preloader] ✅ VND audio ready')
      } catch (error) {
        console.error('[TTS Preloader] ❌ VND generation failed:', error)
        result.errors!.vnd = error as Error
      }
    })(),

    // Legal (NP)
    (async () => {
      try {
        onProgress?.({ current: 2, total: 3, step: 'np' })
        console.log('[TTS Preloader] 🎤 Generating Legal audio...')
        result.np = await ttsClient.generateSpeechURL(cleanedTexts.np, lang)
        console.log('[TTS Preloader] ✅ Legal audio ready')
      } catch (error) {
        console.error('[TTS Preloader] ❌ Legal generation failed:', error)
        result.errors!.np = error as Error
      }
    })(),

    // Summary
    (async () => {
      try {
        onProgress?.({ current: 3, total: 3, step: 'summary' })
        console.log('[TTS Preloader] 🎤 Generating Summary audio...')
        result.summary = await ttsClient.generateSpeechURL(cleanedTexts.summary, lang)
        console.log('[TTS Preloader] ✅ Summary audio ready')
      } catch (error) {
        console.error('[TTS Preloader] ❌ Summary generation failed:', error)
        result.errors!.summary = error as Error
      }
    })()
  ]

  // Ждём завершения всех генераций
  await Promise.all(promises)

  onProgress?.({ current: 3, total: 3, step: 'complete' })

  const successCount = [result.vnd, result.np, result.summary].filter(Boolean).length
  console.log('[TTS Preloader] 🎉 Preload complete:', successCount, '/ 3 successful')

  // Удаляем errors если нет ошибок
  if (Object.keys(result.errors!).length === 0) {
    delete result.errors
  }

  return result
}

/**
 * Revoke all audio URLs to free memory
 */
export function revokeAudioUrls(audioUrls: PreloadResult) {
  console.log('[TTS Preloader] 🧹 Revoking audio URLs')
  
  if (audioUrls.vnd) {
    URL.revokeObjectURL(audioUrls.vnd)
  }
  if (audioUrls.np) {
    URL.revokeObjectURL(audioUrls.np)
  }
  if (audioUrls.summary) {
    URL.revokeObjectURL(audioUrls.summary)
  }
}
