/**
 * API Endpoint для генерации озвучки демо данных
 * POST /api/admin/virtual-director-settings/generate-audio
 * Генерирует озвучку сразу для всех 3 языков (ru, kk, en)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { prepareTextForTTS } from '@/lib/text-sanitizer'

const prisma = new PrismaClient()

const TTS_API_URL = process.env.NEXT_PUBLIC_TTS_API_URL || 'https://tts.sk-ai.kz/api/tts'

// Переводы заголовков разделов
const sectionTitles = {
  ru: {
    vndKeyFindings: 'ВНД: КЛЮЧЕВЫЕ ВЫВОДЫ',
    vndCompliance: 'ВНД: СООТВЕТСТВИЯ',
    vndViolations: 'ВНД: НАРУШЕНИЯ',
    vndRisks: 'ВНД: РИСКИ',
    vndRecommendations: 'ВНД: РЕКОМЕНДАЦИИ',
    sources: 'ИСТОЧНИКИ',
    npaKeyFindings: 'НПА: КЛЮЧЕВЫЕ ВЫВОДЫ',
    npaCompliance: 'НПА: СООТВЕТСТВИЯ',
    npaViolations: 'НПА: НАРУШЕНИЯ / РИСК НЕСОБЛЮДЕНИЯ',
    npaRisks: 'НПА: ПРАВОВЫЕ РИСКИ',
    npaRecommendations: 'НПА: РЕКОМЕНДАЦИИ ПО СООТВЕТСТВИЮ',
    npaSources: 'ИСТОЧНИКИ НПА',
    agendaItem: 'ПУНКТ ПОВЕСТКИ ДНЯ',
    decision: 'РЕШЕНИЕ НЕЗАВИСИМОГО ЧЛЕНА СД',
    briefConclusion: 'КРАТКОЕ ЗАКЛЮЧЕНИЕ',
    reasoning: 'ОБОСНОВАНИЕ',
    finalConclusion: 'ИТОГОВОЕ ЗАКЛЮЧЕНИЕ'
  },
  kk: {
    vndKeyFindings: 'ІБЖ: НЕГІЗГІ ҚОРЫТЫНДЫЛАР',
    vndCompliance: 'ІБЖ: СӘЙКЕСТІКТЕР',
    vndViolations: 'ІБЖ: БҰЗУШЫЛЫҚТАР',
    vndRisks: 'ІБЖ: ТӘУЕКЕЛДЕР',
    vndRecommendations: 'ІБЖ: ҰСЫНЫМДАР',
    sources: 'ДЕРЕККӨЗДЕР',
    npaKeyFindings: 'ҚҚА: НЕГІЗГІ ҚОРЫТЫНДЫЛАР',
    npaCompliance: 'ҚҚА: СӘЙКЕСТІКТЕР',
    npaViolations: 'ҚҚА: БҰЗУШЫЛЫҚТАР / СӘЙКЕССІЗДІК ТӘУЕКЕЛІ',
    npaRisks: 'ҚҚА: ҚҰҚЫҚТЫҚ ТӘУЕКЕЛДЕР',
    npaRecommendations: 'ҚҚА: СӘЙКЕСТІК БОЙЫНША ҰСЫНЫМДАР',
    npaSources: 'ҚҚА ДЕРЕККӨЗДЕРІ',
    agendaItem: 'КҮН ТӘРТІБІ ТАРМАҒЫ',
    decision: 'ДК ТМ ШЕШІМІ',
    briefConclusion: 'ҚЫСҚАША ҚОРЫТЫНДЫ',
    reasoning: 'НЕГІЗДЕМЕ',
    finalConclusion: 'ҚОРЫТЫНДЫ ҚОРЫТЫНДЫ'
  },
  en: {
    vndKeyFindings: 'ICD: KEY FINDINGS',
    vndCompliance: 'ICD: COMPLIANCE',
    vndViolations: 'ICD: VIOLATIONS',
    vndRisks: 'ICD: RISKS',
    vndRecommendations: 'ICD: RECOMMENDATIONS',
    sources: 'SOURCES',
    npaKeyFindings: 'NLA: KEY FINDINGS',
    npaCompliance: 'NLA: COMPLIANCE',
    npaViolations: 'NLA: VIOLATIONS / NON-COMPLIANCE RISK',
    npaRisks: 'NLA: LEGAL RISKS',
    npaRecommendations: 'NLA: COMPLIANCE RECOMMENDATIONS',
    npaSources: 'NLA SOURCES',
    agendaItem: 'AGENDA ITEM',
    decision: 'INDEPENDENT BOARD MEMBER DECISION',
    briefConclusion: 'BRIEF CONCLUSION',
    reasoning: 'JUSTIFICATION',
    finalConclusion: 'FINAL CONCLUSION'
  }
}

// Функция генерации аудио через TTS API
async function generateAudio(text: string, lang: 'ru' | 'kk' | 'en'): Promise<string> {
  console.log(`[Generate Audio] Generating for ${lang}, text length: ${text.length}`)
  
  const response = await fetch(TTS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      lang,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`TTS API error: ${response.status} - ${errorText}`)
  }

  // Получаем аудио поток
  const audioBuffer = await response.arrayBuffer()
  
  // Конвертируем в base64 data URI
  const base64Audio = Buffer.from(audioBuffer).toString('base64')
  const audioUrl = `data:audio/mpeg;base64,${base64Audio}`
  
  console.log(`[Generate Audio] ✅ Generated ${lang} audio, size: ${audioBuffer.byteLength} bytes`)
  
  return audioUrl
}

// Генерация для одного языка
async function generateLanguageAudio(demoData: any, lang: 'ru' | 'kk' | 'en') {
  const titles = sectionTitles[lang]
  
  // Формируем тексты для каждой вкладки
  const vndText = prepareTextForTTS(`
**${titles.vndKeyFindings}**
${demoData.vndKeyFindings?.[lang] || ''}

**${titles.vndCompliance}**
${demoData.vndCompliance?.[lang] || ''}

**${titles.vndViolations}**
${demoData.vndViolations?.[lang] || ''}

**${titles.vndRisks}**
${demoData.vndRisks?.[lang] || ''}

**${titles.vndRecommendations}**
${demoData.vndRecommendations?.[lang] || ''}

**${titles.sources}**
${demoData.vndSources?.[lang] || ''}
  `.trim(), 5000)

  const npText = prepareTextForTTS(`
**${titles.npaKeyFindings}**
${demoData.npaKeyFindings?.[lang] || ''}

**${titles.npaCompliance}**
${demoData.npaCompliance?.[lang] || ''}

**${titles.npaViolations}**
${demoData.npaViolations?.[lang] || ''}

**${titles.npaRisks}**
${demoData.npaRisks?.[lang] || ''}

**${titles.npaRecommendations}**
${demoData.npaRecommendations?.[lang] || ''}

**${titles.npaSources}**
${demoData.npaSources?.[lang] || ''}
  `.trim(), 5000)

  const summaryText = prepareTextForTTS(`
**${titles.agendaItem}:**
${demoData.agendaItem?.[lang] || ''}

**${titles.decision}:**
${demoData.vote?.[lang] || ''}

**${titles.briefConclusion}:**
${demoData.briefConclusion?.[lang] || ''}

**${titles.reasoning}:**
${demoData.reasoning?.[lang] || ''}

**${titles.finalConclusion}:**
${demoData.finalConclusion?.[lang] || ''}
  `.trim(), 5000)

  console.log(`[Generate Audio API] 📝 ${lang.toUpperCase()} text lengths:`, {
    vnd: vndText.length,
    np: npText.length,
    summary: summaryText.length
  })

  // Генерируем аудио параллельно для всех трёх вкладок
  const [audioVnd, audioNp, audioSummary] = await Promise.all([
    generateAudio(vndText, lang),
    generateAudio(npText, lang),
    generateAudio(summaryText, lang)
  ])

  return {
    vnd: audioVnd,
    np: audioNp,
    summary: audioSummary,
    sizes: {
      vnd: audioVnd.length,
      np: audioNp.length,
      summary: audioSummary.length
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log(`[Generate Audio API] � Starting audio generation for ALL languages (ru, kk, en)`)

    // Получаем демо данные из БД
    const demoDataRecord = await prisma.dialogSettings.findUnique({
      where: { key: 'virtual-director-demo-data' }
    })

    if (!demoDataRecord) {
      console.error('[Generate Audio API] ❌ Demo data not found in database')
      return NextResponse.json(
        { 
          error: 'Demo data not found',
          message: 'Пожалуйста, сначала заполните и сохраните демо данные в админ панели',
          instructions: [
            '1. Переключитесь на вкладку "Демо режим"',
            '2. Заполните все поля на трех языках (ru, kk, en)',
            '3. Нажмите "Сохранить настройки"',
            '4. После этого можно генерировать озвучку'
          ]
        },
        { status: 404 }
      )
    }

    const demoData = JSON.parse(demoDataRecord.value)
    
    // Проверяем что данные не пустые
    if (!demoData || Object.keys(demoData).length === 0) {
      console.error('[Generate Audio API] ❌ Demo data is empty')
      return NextResponse.json(
        { 
          error: 'Demo data is empty',
          message: 'Демо данные существуют, но пусты. Пожалуйста, заполните их в админ панели'
        },
        { status: 400 }
      )
    }

    // Генерируем аудио для всех трёх языков параллельно
    console.log('[Generate Audio API] 🎬 Starting parallel generation for all languages...')
    
    const [ruAudio, kkAudio, enAudio] = await Promise.all([
      generateLanguageAudio(demoData, 'ru'),
      generateLanguageAudio(demoData, 'kk'),
      generateLanguageAudio(demoData, 'en')
    ])

    console.log('[Generate Audio API] ✅ All audio generated successfully for all languages')

    // Сохраняем аудио в БД для каждого языка
    await Promise.all([
      prisma.dialogSettings.upsert({
        where: { key: 'virtual-director-demo-audio-ru' },
        update: {
          value: JSON.stringify({
            vnd: ruAudio.vnd,
            np: ruAudio.np,
            summary: ruAudio.summary,
            generatedAt: new Date().toISOString()
          })
        },
        create: {
          key: 'virtual-director-demo-audio-ru',
          value: JSON.stringify({
            vnd: ruAudio.vnd,
            np: ruAudio.np,
            summary: ruAudio.summary,
            generatedAt: new Date().toISOString()
          })
        }
      }),
      prisma.dialogSettings.upsert({
        where: { key: 'virtual-director-demo-audio-kk' },
        update: {
          value: JSON.stringify({
            vnd: kkAudio.vnd,
            np: kkAudio.np,
            summary: kkAudio.summary,
            generatedAt: new Date().toISOString()
          })
        },
        create: {
          key: 'virtual-director-demo-audio-kk',
          value: JSON.stringify({
            vnd: kkAudio.vnd,
            np: kkAudio.np,
            summary: kkAudio.summary,
            generatedAt: new Date().toISOString()
          })
        }
      }),
      prisma.dialogSettings.upsert({
        where: { key: 'virtual-director-demo-audio-en' },
        update: {
          value: JSON.stringify({
            vnd: enAudio.vnd,
            np: enAudio.np,
            summary: enAudio.summary,
            generatedAt: new Date().toISOString()
          })
        },
        create: {
          key: 'virtual-director-demo-audio-en',
          value: JSON.stringify({
            vnd: enAudio.vnd,
            np: enAudio.np,
            summary: enAudio.summary,
            generatedAt: new Date().toISOString()
          })
        }
      })
    ])

    console.log(`[Generate Audio API] 💾 Audio saved to DB for all languages`)

    return NextResponse.json({
      success: true,
      message: 'Audio generated and saved successfully for all languages',
      languages: ['ru', 'kk', 'en'],
      sizes: {
        ru: ruAudio.sizes,
        kk: kkAudio.sizes,
        en: enAudio.sizes
      }
    })

  } catch (error) {
    console.error('[Generate Audio API] ❌ Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate audio',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
