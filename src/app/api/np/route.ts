import { NextRequest, NextResponse } from 'next/server'
import { alemllm } from '@/lib/alemllm'
import { embeddingClient } from '@/lib/embedding-client'
import { searchNPA } from '@/lib/vector-db'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Генерируем embedding для вопроса пользователя
    let queryVector: number[]
    try {
      queryVector = await embeddingClient.embedSingle(message)
    } catch (error) {
      console.error('Embedding service error:', error)
      return NextResponse.json({ 
        error: 'Ошибка при генерации embedding. Проверьте, что embedding service запущен.' 
      }, { status: 503 })
    }

    // Ищем релевантные документы в векторной БД НПА (с гибридным поиском)
    let context = ''
    let hasContextFromDB = false
    try {
      const searchResults = await searchNPA(message, queryVector, { 
        topK: 10,
        minScore: 0.01  // Понижаем порог для большего количества результатов
      })
      
      console.log('[NPA] Search results count:', searchResults.length)
      
      if (searchResults.length > 0) {
        hasContextFromDB = true
        context = searchResults
          .map((result, idx) => {
            const docType = result.metadata?.docType || 'Не указано'
            const docNumber = result.metadata?.docNumber || 'Не указано'
            const sourceUrl = result.metadata?.sourceUrl || ''
            
            return `[${idx + 1}] ${result.title}\nТип: ${docType} | Номер: ${docNumber}\nРелевантность: ${(result.similarity * 100).toFixed(2)}%\nТекст: ${result.text}${sourceUrl ? `\nИсточник: ${sourceUrl}` : ''}\n`
          })
          .join('\n---\n')
        
        console.log('[NPA] Context length:', context.length, 'chars')
      } else {
        console.log('[NPA] No results found from vector search')
      }
    } catch (error) {
      console.error('Vector DB search error:', error)
      // Не возвращаем ошибку, продолжаем с пустым контекстом
    }

    // Формируем промпт для alemllm
    const systemPrompt = `Ты профессиональный ИИ-ассистент для работы с правовыми документами и нормативными актами Республики Казахстан.

Твоя специализация - законодательство РК, включая:
- Закон "Об акционерных обществах"
- Закон "О Фонде национального благосостояния"
- Налоговый кодекс РК
- Трудовой кодекс РК
- Гражданский кодекс РК
- Другие нормативно-правовые акты Казахстана

**ВАЖНО:**
- Если в базе данных найдены релевантные НПА, используй их как основной источник
- Если база не содержит нужной информации, используй свои знания законодательства РК
- Всегда указывай источник: "Согласно статье X Закона..." или "На основе общих норм законодательства РК..."
- Давай юридически точные формулировки
- Ссылайся на конкретные статьи, пункты, подпункты законов

При ответе:
- Структурируй информацию четко и понятно
- Приводи конкретные нормы и статьи
- Если нужна консультация специалиста, укажи это
- Будь профессиональным и точным

Формат ответа: структурированный, с ссылками на законодательство.`

    const userPrompt = hasContextFromDB 
      ? `Контекст из нормативно-правовых актов Республики Казахстан:

${context}

Вопрос пользователя: ${message}

Ответь на вопрос, используя информацию из предоставленного контекста НПА. Ссылайся на конкретные статьи и документы.`
      : `Вопрос пользователя по законодательству Республики Казахстан: ${message}

Примечание: Релевантные документы из базы НПА не найдены. Ответь на основе своих знаний законодательства Казахстана. Обязательно укажи, что для точной информации рекомендуется проверить актуальные версии законов на портале zan.gov.kz.`

    // Получаем ответ от alemllm
    let response: string
    try {
      response = await alemllm.complete(userPrompt, systemPrompt, {
        max_tokens: 4096,
        temperature: 0.2
      })
    } catch (error) {
      console.error('AlemLLM API error:', error)
      return NextResponse.json({ 
        error: 'Ошибка при обращении к AlemLLM API' 
      }, { status: 503 })
    }

    return NextResponse.json({ response })

  } catch (error) {
    console.error('NP API Error:', error)
    return NextResponse.json({ 
      error: 'Произошла внутренняя ошибка сервера' 
    }, { status: 500 })
  }
}