// API endpoint для получения конфигурации Azure Speech
// Безопасно возвращает ключи только на сервере

import { NextResponse } from 'next/server'

export async function GET() {
  const speechKey = process.env.AZURE_SPEECH_KEY
  const speechRegion = process.env.AZURE_SPEECH_REGION

  if (!speechKey || !speechRegion) {
    return NextResponse.json(
      { error: 'Azure Speech configuration not found' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    key: speechKey,
    region: speechRegion,
  })
}
