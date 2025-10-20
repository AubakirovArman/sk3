import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - получить настройки
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Ищем настройку с ключом 'virtual_director_mode'
    const settings = await prisma.dialogSettings.findMany({
      where: {
        key: {
          in: ['virtual_director_mode', 'virtual_director_demo_data']
        }
      }
    })

    const modeSettings = settings.find((s: any) => s.key === 'virtual_director_mode')
    const demoDataSettings = settings.find((s: any) => s.key === 'virtual_director_demo_data')

    return NextResponse.json({
      mode: modeSettings?.value || 'real',
      demoData: demoDataSettings?.value ? JSON.parse(demoDataSettings.value) : null
    })
  } catch (error) {
    console.error('[Admin API] Error fetching virtual director settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - сохранить настройки
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { mode, demoData } = body

    // Сохраняем режим
    await prisma.dialogSettings.upsert({
      where: { key: 'virtual_director_mode' },
      update: { value: mode },
      create: { key: 'virtual_director_mode', value: mode }
    })

    // Сохраняем демо-данные
    await prisma.dialogSettings.upsert({
      where: { key: 'virtual_director_demo_data' },
      update: { value: JSON.stringify(demoData) },
      create: { key: 'virtual_director_demo_data', value: JSON.stringify(demoData) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin API] Error saving virtual director settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
