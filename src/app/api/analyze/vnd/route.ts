import { NextRequest, NextResponse } from 'next/server'
import { alemllm } from '@/lib/alemllm'
import { embeddingClient } from '@/lib/embedding-client'
import { searchVND } from '@/lib/vector-db'

export async function POST(request: NextRequest) {
  try {
    const { documentContent, language = 'ru' } = await request.json()
    
    if (!documentContent || !documentContent.trim()) {
      return NextResponse.json({ error: 'Содержимое документа обязательно' }, { status: 400 })
    }

    // Валидация языка
    const validLanguages = ['ru', 'kk', 'en']
    const targetLang = validLanguages.includes(language) ? language : 'ru'
    
    console.log('[VND] 🌐 Requested language:', language)
    console.log('[VND] 🎯 Target language:', targetLang)

    const queryVector = await embeddingClient.embedSingle(documentContent)
    const searchResults = await searchVND(queryVector, { topK: 5, minScore: 0.3, limit: 8 })

    // Ограничиваем длину каждого фрагмента
    const context = searchResults.map((result, idx) => {
      const textPreview = result.text.length > 800 ? result.text.substring(0, 800) + '...' : result.text
      return `[${idx + 1}] ${result.metadata.docTitle || result.metadata.filename}\n` +
        `Раздел: ${result.title}\n` +
        `Релевантность: ${(result.similarity * 100).toFixed(1)}%\n` +
        `Текст: ${textPreview}\n`
    }).join('\n---\n')

    console.log('[VND] Context size:', context.length, 'chars')
    console.log('[VND] Document size:', documentContent.length, 'chars')

    // Ограничиваем размер документа
    const docPreview = documentContent.length > 2000 
      ? documentContent.substring(0, 2000) + '\n...(документ обрезан)'
      : documentContent

    // Промпты на разных языках
    const languageInstructions = {
      ru: {
        system: `Ты эксперт-аналитик по корпоративным документам АО «Самрук-Қазына».

Структура ответа:
**ВНД: КЛЮЧЕВЫЕ ВЫВОДЫ:**
**ВНД: СООТВЕТСТВИЯ:**
**ВНД: НАРУШЕНИЯ:**
**ВНД: РИСКИ:**
**ВНД: РЕКОМЕНДАЦИИ:**
**ИСТОЧНИКИ:**`,
        user: `Контекст ВНД:\n${context}\n\nДокумент:\n${docPreview}\n\nАнализ:`
      },
      kk: {
        system: `Сіз «Самұрық-Қазына» АҚ корпоративтік құжаттары бойынша сарапшы-талдаушысыз.

Жауап құрылымы:
**ІНҚ: НЕГІЗГІ ҚОРЫТЫНДЫЛАР:**
**ІНҚ: СӘЙКЕСТІКТЕР:**
**ІНҚ: БҰЗУШЫЛЫҚТАР:**
**ІНҚ: ТӘУЕКЕЛДЕР:**
**ІНҚ: ҰСЫНЫСТАР:**
**ДЕРЕККӨЗДЕР:**`,
        user: `ІНҚ контексті:\n${context}\n\nҚұжат:\n${docPreview}\n\nТалдау:`
      },
      en: {
        system: `You are an expert analyst on corporate documents of JSC "Samruk-Kazyna".

Response structure:
**ICD: KEY FINDINGS:**
**ICD: COMPLIANCE:**
**ICD: VIOLATIONS:**
**ICD: RISKS:**
**ICD: RECOMMENDATIONS:**
**SOURCES:**`,
        user: `ICD context:\n${context}\n\nDocument:\n${docPreview}\n\nAnalysis:`
      }
    }

    const prompts = languageInstructions[targetLang as keyof typeof languageInstructions]
    const systemPrompt = prompts.system
    const userPrompt = prompts.user

    const result = await alemllm.complete(userPrompt, systemPrompt, { max_tokens: 4096, temperature: 0.7 })

    return NextResponse.json({ success: true, result })

  } catch (error) {
    console.error('Ошибка ВНД:', error)
    const msg = error instanceof Error ? error.message : 'Ошибка'
    
    if (msg.includes('Embedding')) return NextResponse.json({ error: 'Сервис эмбеддингов недоступен' }, { status: 503 })
    if (msg.includes('search')) return NextResponse.json({ error: 'Ошибка БД ВНД' }, { status: 503 })
    if (msg.includes('AlemLLM')) return NextResponse.json({ error: 'Ошибка AlemLLM' }, { status: 503 })
    
    return NextResponse.json({ error: 'Ошибка анализа' }, { status: 500 })
  }
}
