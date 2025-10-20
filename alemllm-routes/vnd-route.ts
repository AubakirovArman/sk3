import { NextRequest, NextResponse } from 'next/server'
import { alemllm } from '@/lib/alemllm'
import { embeddingClient } from '@/lib/embedding-client'
import { searchVND } from '@/lib/vector-db'

export async function POST(request: NextRequest) {
  try {
    const { documentContent } = await request.json()
    
    if (!documentContent || !documentContent.trim()) {
      return NextResponse.json({ error: 'Содержимое документа обязательно' }, { status: 400 })
    }

    const queryVector = await embeddingClient.embedSingle(documentContent)
    const searchResults = await searchVND(queryVector, { topK: 10, minScore: 0.3, limit: 15 })

    const context = searchResults.map((result, idx) => 
      `[${idx + 1}] ${result.metadata.docTitle || result.metadata.filename}\n` +
      `Раздел: ${result.title}\nСходство: ${(result.similarity * 100).toFixed(1)}%\n` +
      `Текст: ${result.text}\n`
    ).join('\n---\n\n')

    const systemPrompt = `Ты эксперт-аналитик по корпоративным документам АО «Самрук-Қазына».

Структура ответа (строго):
**ВНД: КЛЮЧЕВЫЕ ВЫВОДЫ:** (8-12 пунктов)
**ВНД: СООТВЕТСТВИЯ:** (10+ пунктов)
**ВНД: НАРУШЕНИЯ / НЕСООТВЕТСТВИЯ:**
**ВНД: РИСКИ:** (8+ типов)
**ВНД: РЕКОМЕНДАЦИИ:** (10+ пунктов)
**ИСТОЧНИКИ ВНД:**

Используй только информацию из контекста. Минимум 1500 слов.`

    const userPrompt = `КОНТЕКСТ ВНД:\n${context}\n\nДОКУМЕНТ:\n${documentContent}\n\nПроведи анализ.`

    const result = await alemllm.complete(userPrompt, systemPrompt, { max_tokens: 8096, temperature: 0.7 })

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
