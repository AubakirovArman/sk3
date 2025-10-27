import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface AutoResponderSettings {
  enabled: boolean
  textRu: string
  textKk: string
  textEn: string
}

// GET - получить настройки автоответчика
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { role?: string }
    if (user.role !== 'dialog_admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Загружаем настройки из базы данных
    const enabledSetting = await prisma.dialogSettings.findUnique({
      where: { key: 'auto_responder_enabled' }
    })
    
    const textRuSetting = await prisma.dialogSettings.findUnique({  
      where: { key: 'auto_responder_text_ru' }
    })
    
    const textKkSetting = await prisma.dialogSettings.findUnique({  
      where: { key: 'auto_responder_text_kk' }
    })
    
    const textEnSetting = await prisma.dialogSettings.findUnique({  
      where: { key: 'auto_responder_text_en' }
    })

    const settings: AutoResponderSettings = {
      enabled: enabledSetting?.value === 'true',
      textRu: textRuSetting?.value || '',
      textKk: textKkSetting?.value || '',
      textEn: textEnSetting?.value || ''
    }

    return NextResponse.json({
      success: true,
      settings
    })

  } catch (error) {
    console.error('[Auto Responder API] GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - сохранить настройки автоответчика
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as { role?: string }
    if (user.role !== 'dialog_admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { enabled, textRu, textKk, textEn }: AutoResponderSettings = body

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Invalid enabled value' },
        { status: 400 }
      )
    }

    if (typeof textRu !== 'string' || typeof textKk !== 'string' || typeof textEn !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid text values' },
        { status: 400 }
      )
    }

    // Сохраняем настройки в базе данных
    await prisma.dialogSettings.upsert({
      where: { key: 'auto_responder_enabled' },
      update: { value: enabled.toString() },
      create: { key: 'auto_responder_enabled', value: enabled.toString() }
    })

    await prisma.dialogSettings.upsert({
      where: { key: 'auto_responder_text_ru' },
      update: { value: textRu },
      create: { key: 'auto_responder_text_ru', value: textRu }
    })
    
    await prisma.dialogSettings.upsert({
      where: { key: 'auto_responder_text_kk' },
      update: { value: textKk },
      create: { key: 'auto_responder_text_kk', value: textKk }
    })
    
    await prisma.dialogSettings.upsert({
      where: { key: 'auto_responder_text_en' },
      update: { value: textEn },
      create: { key: 'auto_responder_text_en', value: textEn }
    })

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully'
    })

  } catch (error) {
    console.error('[Auto Responder API] POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}