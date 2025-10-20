import { NextRequest, NextResponse } from 'next/server'
import { alemllm } from '@/lib/alemllm'
import { embeddingClient } from '@/lib/embedding-client'
import { searchNPA } from '@/lib/vector-db'

export async function POST(request: NextRequest) {
  try {
    const { documentContent, language = 'ru' } = await request.json()
    
    if (!documentContent || !documentContent.trim()) {
      return NextResponse.json({ error: 'Содержимое документа обязательно' }, { status: 400 })
    }

    // Валидация языка
    const validLanguages = ['ru', 'kk', 'en']
    const targetLang = validLanguages.includes(language) ? language : 'ru'

    const queryVector = await embeddingClient.embedSingle(documentContent)
    const searchResults = await searchNPA(documentContent, queryVector, { topK: 10, minScore: 0.3 })

    const context = searchResults.map((result, idx) => 
      `[${idx + 1}] ${result.title}\n` +
      `Тип: ${result.metadata.docType || 'Н/Д'}\n` +
      `Номер: ${result.metadata.docNumber || 'Н/Д'}\n` +
      `Сходство: ${(result.similarity * 100).toFixed(1)}%\n` +
      `Текст: ${result.text}\n` +
      `Ссылка: ${result.metadata.sourceUrl || 'Н/Д'}\n`
    ).join('\n---\n\n')

    // Промпты на разных языках
    const languageInstructions = {
      ru: {
        system: `Ты профессиональный юрист-аналитик по законодательству РК.

Структура ответа (строго):
**НПА: КЛЮЧЕВЫЕ ВЫВОДЫ:** (8-12 пунктов)
**НПА: СООТВЕТСТВИЯ:** (10+ пунктов)
**НПА: НАРУШЕНИЯ / РИСК НЕСОБЛЮДЕНИЯ:**
**НПА: ПРАВОВЫЕ РИСКИ:** (10+ категорий)
**НПА: РЕКОМЕНДАЦИИ ПО СООТВЕТСТВИЮ:** (10+ пунктов)
**ИСТОЧНИКИ НПА:**

Используй только информацию из контекста. Минимум 1500 слов.`,
        user: `КОНТЕКСТ НПА:\n${context}\n\nДОКУМЕНТ:\n${documentContent}\n\nПроведи правовой анализ.`
      },
      kk: {
        system: `Сіз ҚР заңнамасы бойынша кәсіби заңгер-талдаушысыз.

Жауап құрылымы (қатаң):
**ҚБА: НЕГІЗГІ ҚОРЫТЫНДЫЛАР:** (8-12 тармақ)
**ҚБА: СӘЙКЕСТІКТЕР:** (10+ тармақ)
**ҚБА: БҰЗУШЫЛЫҚТАР / САҚТАМАУ ҚАУПІ:**
**ҚБА: ҚҰҚЫҚТЫҚ ТӘУЕКЕЛДЕР:** (10+ санат)
**ҚБА: СӘЙКЕСТІККЕ ҚАТЫСТЫ ҰСЫНЫСТАР:** (10+ тармақ)
**ҚБА ДЕРЕККӨЗДЕРІ:**

Тек контекстегі ақпаратты пайдаланыңыз. Кемінде 1500 сөз.`,
        user: `ҚБА КОНТЕКСТІ:\n${context}\n\nҚҰЖАТ:\n${documentContent}\n\nҚұқықтық талдау жүргізіңіз.`
      },
      en: {
        system: `You are a professional legal analyst on the legislation of the Republic of Kazakhstan.

Response structure (strict):
**RLA: KEY FINDINGS:** (8-12 points)
**RLA: COMPLIANCE:** (10+ points)
**RLA: VIOLATIONS / NON-COMPLIANCE RISK:**
**RLA: LEGAL RISKS:** (10+ categories)
**RLA: COMPLIANCE RECOMMENDATIONS:** (10+ points)
**RLA SOURCES:**

Use only information from context. Minimum 1500 words.`,
        user: `RLA CONTEXT:\n${context}\n\nDOCUMENT:\n${documentContent}\n\nConduct legal analysis.`
      }
    }

    const prompts = languageInstructions[targetLang as keyof typeof languageInstructions]
    const systemPrompt = prompts.system
    const userPrompt = prompts.user

    const result = await alemllm.complete(userPrompt, systemPrompt, { max_tokens: 8096, temperature: 0.7 })

    return NextResponse.json({ success: true, result })

  } catch (error) {
    console.error('Ошибка НПА:', error)
    const msg = error instanceof Error ? error.message : 'Ошибка'
    
    if (msg.includes('Embedding')) return NextResponse.json({ error: 'Сервис эмбеддингов недоступен' }, { status: 503 })
    if (msg.includes('search')) return NextResponse.json({ error: 'Ошибка БД НПА' }, { status: 503 })
    if (msg.includes('AlemLLM')) return NextResponse.json({ error: 'Ошибка AlemLLM' }, { status: 503 })
    
    return NextResponse.json({ error: 'Ошибка анализа' }, { status: 500 })
  }
}
