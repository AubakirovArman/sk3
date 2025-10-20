/**
 * TTS API Proxy
 * Решает проблему CORS, проксируя запросы к TTS API
 */

import { NextRequest, NextResponse } from 'next/server'

const TTS_API_URL = process.env.NEXT_PUBLIC_TTS_API_URL || 'https://tts.sk-ai.kz/api/tts'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, lang } = body

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    console.log('[TTS Proxy] 🎤 Generating speech...')
    console.log('[TTS Proxy] 📝 Text length:', text.length)
    console.log('[TTS Proxy] 🌐 Language:', lang || 'ru')

    // Проксируем запрос к TTS API
    const response = await fetch(TTS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        lang: lang || 'ru',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[TTS Proxy] ❌ TTS API error:', errorText)
      return NextResponse.json(
        { error: `TTS API error: ${response.status}` },
        { status: response.status }
      )
    }

    // Получаем аудио поток
    const audioBuffer = await response.arrayBuffer()
    console.log('[TTS Proxy] ✅ Speech generated, size:', audioBuffer.byteLength, 'bytes')

    // Конвертируем в base64 для встраивания
    const base64Audio = Buffer.from(audioBuffer).toString('base64')
    const audioUrl = `data:audio/mpeg;base64,${base64Audio}`

    return NextResponse.json({
      success: true,
      audioUrl,
    })
  } catch (error) {
    console.error('[TTS Proxy] ❌ Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    )
  }
}
