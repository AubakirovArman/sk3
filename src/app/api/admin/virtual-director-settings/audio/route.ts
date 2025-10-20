/**
 * API Endpoint для получения предгенерированной озвучки демо данных
 * GET /api/admin/virtual-director-settings/audio?lang=ru
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const lang = searchParams.get('lang')

    if (!lang || !['ru', 'kk', 'en'].includes(lang)) {
      return NextResponse.json(
        { error: 'Invalid language parameter. Must be ru, kk, or en' },
        { status: 400 }
      )
    }

    // Получаем предгенерированное аудио из БД
    const audioKey = `virtual-director-demo-audio-${lang}`
    const audioRecord = await prisma.dialogSettings.findUnique({
      where: { key: audioKey }
    })

    if (!audioRecord) {
      return NextResponse.json(
        { error: 'Audio not found. Please generate audio first.' },
        { status: 404 }
      )
    }

    const audioData = JSON.parse(audioRecord.value)

    return NextResponse.json({
      success: true,
      audio: {
        vnd: audioData.vnd,
        np: audioData.np,
        summary: audioData.summary
      },
      generatedAt: audioData.generatedAt
    })

  } catch (error) {
    console.error('[Get Audio API] ❌ Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get audio',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
