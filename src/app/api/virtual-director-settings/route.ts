import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - получить настройки Virtual Director (публичный endpoint)
export async function GET() {
  try {
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
    console.error('[VD Settings API] Error fetching settings:', error)
    return NextResponse.json({ 
      mode: 'real',
      demoData: null 
    }, { status: 200 }) // Возвращаем дефолтные значения в случае ошибки
  }
}
