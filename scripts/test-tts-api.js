/**
 * Тестовый скрипт для проверки TTS API
 * Запуск: node scripts/test-tts-api.js
 */

const TTS_API_URL = process.env.NEXT_PUBLIC_TTS_API_URL || 'https://tts.sk-ai.kz/api/tts'

async function testTTS() {
  try {
    console.log('🎤 Testing TTS API...')
    console.log(`📍 URL: ${TTS_API_URL}`)

    const testText = 'Тест озвучки. Это пробное сообщение.'
    console.log(`📝 Test text: "${testText}"`)

    console.log('\n⏳ Sending request...')
    const startTime = Date.now()

    const response = await fetch(TTS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: testText,
        lang: 'ru',
      }),
    })

    const duration = Date.now() - startTime

    console.log(`\n📊 Response status: ${response.status} ${response.statusText}`)
    console.log(`⏱️  Duration: ${duration}ms`)
    console.log(`📦 Content-Type: ${response.headers.get('content-type')}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error response:', errorText)
      return
    }

    const audioBuffer = await response.arrayBuffer()
    console.log(`✅ Audio received: ${audioBuffer.byteLength} bytes (${(audioBuffer.byteLength / 1024).toFixed(2)} KB)`)

    console.log('\n✨ TTS API is working correctly!')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('\n💡 Possible issues:')
    console.error('   - TTS API server is down')
    console.error('   - Network connectivity issues')
    console.error('   - Invalid API URL')
  }
}

testTTS()
