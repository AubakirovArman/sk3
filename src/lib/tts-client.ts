/**
 * TTS API Client for SK-AI TTS Service
 * Uses Next.js API proxy to avoid CORS issues
 */

export interface TTSRequest {
  text: string
  lang: 'kk' | 'ru' | 'en'
}

export class TTSClient {
  private baseURL: string

  constructor() {
    // Используем Next.js API proxy вместо прямого обращения к TTS API
    this.baseURL = '/api/tts'
  }

  /**
   * Generate speech from text (returns JSON with audioUrl)
   */
  async generateSpeech(text: string, lang: 'kk' | 'ru' | 'en' = 'ru'): Promise<{ success: boolean; audioUrl: string }> {
    console.log('[TTS Client] ==================== API CALL START ====================')
    console.log('[TTS Client] 🎤 Calling TTS API')
    console.log('[TTS Client] � Request params:')
    console.log('  - URL:', this.baseURL)
    console.log('  - Text length:', text.length)
    console.log('  - Language:', lang)
    console.log('  - Text preview:', text.substring(0, 100))

    try {
      const requestBody = { text, lang }
      console.log('[TTS Client] 📤 Sending POST request...')
      
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('[TTS Client] 📥 Response received')
      console.log('  - Status:', response.status)
      console.log('  - Status text:', response.statusText)
      console.log('  - Content-Type:', response.headers.get('content-type'))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[TTS Client] ❌ API returned error status')
        console.error('  - Status:', response.status)
        console.error('  - Error text:', errorText)
        throw new Error(`TTS API error: ${response.status}`)
      }

      const data = await response.json()
      
      console.log('[TTS Client] 📦 Response data:')
      console.log('  - Success:', data.success)
      console.log('  - Has audioUrl:', !!data.audioUrl)
      console.log('  - AudioUrl type:', data.audioUrl?.startsWith('data:') ? 'Data URI' : 'Unknown')
      console.log('  - AudioUrl length:', data.audioUrl?.length)
      
      if (!data.success || !data.audioUrl) {
        console.error('[TTS Client] ❌ Invalid API response format')
        console.error('  - Data:', data)
        throw new Error('Invalid TTS API response')
      }
      
      console.log('[TTS Client] ✅ Speech generated successfully')
      console.log('[TTS Client] ==================== API CALL END ====================')
      
      return data
    } catch (error) {
      console.error('[TTS Client] ==================== ERROR ====================')
      console.error('[TTS Client] ❌ Request failed')
      console.error('  - Error type:', error?.constructor?.name)
      console.error('  - Error message:', error instanceof Error ? error.message : String(error))
      console.error('  - Error stack:', error instanceof Error ? error.stack : 'N/A')
      console.error('[TTS Client] =============================================')
      throw error
    }
  }

  /**
   * Convert base64 data URI to Blob URL for better browser compatibility
   */
  private dataURItoBlob(dataURI: string): Blob {
    console.log('[TTS Client] 🔄 Converting Data URI to Blob')
    console.log('  - Data URI length:', dataURI.length)
    console.log('  - Data URI prefix:', dataURI.substring(0, 50))
    
    try {
      // Extract base64 data
      const parts = dataURI.split(',')
      if (parts.length !== 2) {
        throw new Error('Invalid data URI format')
      }
      
      const byteString = atob(parts[1])
      const mimeString = parts[0].split(':')[1].split(';')[0]
      
      console.log('[TTS Client] 📊 Extraction details:')
      console.log('  - MIME type:', mimeString)
      console.log('  - Byte string length:', byteString.length)
      
      // Convert to byte array
      const ab = new ArrayBuffer(byteString.length)
      const ia = new Uint8Array(ab)
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
      }
      
      const blob = new Blob([ab], { type: mimeString })
      console.log('[TTS Client] ✅ Blob created')
      console.log('  - Blob size:', blob.size, 'bytes')
      console.log('  - Blob type:', blob.type)
      
      return blob
    } catch (error) {
      console.error('[TTS Client] ❌ Data URI to Blob conversion failed')
      console.error('  - Error:', error)
      throw error
    }
  }

  /**
   * Generate speech and return Blob URL for better compatibility
   */
  async generateSpeechURL(text: string, lang: 'kk' | 'ru' | 'en' = 'ru'): Promise<string> {
    console.log('[TTS Client] 🎯 generateSpeechURL called')
    
    const result = await this.generateSpeech(text, lang)
    
    console.log('[TTS Client] 🔄 Converting to Blob URL...')
    // Convert data URI to Blob URL for better browser compatibility
    const blob = this.dataURItoBlob(result.audioUrl)
    const blobUrl = URL.createObjectURL(blob)
    
    console.log('[TTS Client] ✅ Blob URL created successfully')
    console.log('  - Blob URL:', blobUrl)
    console.log('  - URL length:', blobUrl.length)
    
    return blobUrl
  }
}

// Export singleton instance
export const ttsClient = new TTSClient()
