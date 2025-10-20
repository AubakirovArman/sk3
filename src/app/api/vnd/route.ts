import { NextRequest, NextResponse } from 'next/server'
import { alemllm } from '@/lib/alemllm'
import { embeddingClient } from '@/lib/embedding-client'
import { searchVND } from '@/lib/vector-db'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    console.log('[VND] 📥 Received message:', message?.substring(0, 100))

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Генерируем embedding для вопроса пользователя
    let queryVector: number[]
    try {
      console.log('[VND] 🔢 Generating embedding...')
      queryVector = await embeddingClient.embedSingle(message)
      console.log('[VND] ✅ Embedding generated, length:', queryVector.length)
    } catch (error) {
      console.error('[VND] ❌ Embedding service error:', error)
      return NextResponse.json({ 
        error: 'Ошибка при генерации embedding. Проверьте, что embedding service запущен.' 
      }, { status: 503 })
    }

    // Ищем релевантные документы в векторной БД ВНД
    let context = ''
    let hasContextFromDB = false
    try {
      console.log('[VND] 🔍 Searching in vector DB...')
      const searchResults = await searchVND(queryVector, { 
        topK: 5,  // Уменьшено с 10 до 5
        limit: 8  // Уменьшено с 15 до 8
      })
      console.log('[VND] 📊 Search results count:', searchResults.length)
      
      if (searchResults.length > 0) {
        hasContextFromDB = true
        
        // Ограничиваем длину текста каждого результата
        const MAX_TEXT_LENGTH = 2000  // Максимум 2000 символов на результат
        const MAX_TOTAL_CONTEXT = 15000  // Максимум 15KB общего контекста
        
        let totalLength = 0
        const limitedResults: string[] = []
        
        for (const result of searchResults) {
          // Обрезаем текст если он слишком длинный
          const truncatedText = result.text.length > MAX_TEXT_LENGTH 
            ? result.text.substring(0, MAX_TEXT_LENGTH) + '...'
            : result.text
          
          const resultText: string = `[${limitedResults.length + 1}] ${result.title}\nРаздел: ${result.metadata?.section_title || 'Не указано'}\nСходство: ${(result.similarity * 100).toFixed(1)}%\nТекст: ${truncatedText}\n`
          
          // Проверяем, не превысим ли мы лимит
          if (totalLength + resultText.length > MAX_TOTAL_CONTEXT) {
            console.log('[VND] ⚠️ Context size limit reached, stopping at', limitedResults.length, 'results')
            break
          }
          
          limitedResults.push(resultText)
          totalLength += resultText.length
        }
        
        context = limitedResults.join('\n---\n')
        console.log('[VND] ✅ Context prepared, length:', context.length, 'chars (from', searchResults.length, 'results)')
      } else {
        console.log('[VND] ⚠️ No results found from vector search')
      }
    } catch (error) {
      console.error('[VND] ❌ Vector DB search error:', error)
      // Не возвращаем ошибку, просто логируем и продолжаем с пустым контекстом
    }

    // Формируем промпт для alemllm
    const systemPrompt = `Ты виртуальный директор АО «Самрук-Қазына», специализирующийся на управленческих решениях и стратегическом планировании бизнеса.

Твоя задача - отвечать на вопросы по внутренним нормативным документам (ВНД) компании Самрук-Қазына.

**ВАЖНО:**
- АО «Самрук-Қазына» - крупнейший холдинг Казахстана, управляющий национальными компаниями
- ВНД включают: политики, регламенты, процедуры, стандарты управления, правила корпоративного управления
- Если в базе данных нет информации, используй свои общие знания о корпоративном управлении и практиках крупных холдингов
- Всегда указывай источник: "По данным ВНД..." или "На основе общих принципов корпоративного управления..."

При ответе:
- Давай практические и конкретные рекомендации
- Структурируй ответ четко и профессионально
- Если используешь общие знания, упомяни, что для точного ответа нужен доступ к актуальным ВНД
- Предлагай обратиться в соответствующий департамент для уточнения деталей

Формат ответа: понятный, структурированный, профессиональный.`

    const userPrompt = hasContextFromDB 
      ? `Контекст из внутренних нормативных документов АО «Самрук-Қазына»:

${context}

Вопрос пользователя: ${message}

Ответь на вопрос, используя информацию из предоставленного контекста ВНД. Ссылайся на конкретные документы и разделы.`
      : `Вопрос пользователя по внутренним нормативным документам АО «Самрук-Қазына»: ${message}

Примечание: В данный момент релевантные документы из базы ВНД не найдены. Ответь на основе общих знаний о корпоративном управлении и практиках крупных холдингов. Обязательно укажи, что для точной информации нужен доступ к актуальным ВНД компании.`

    // Получаем ответ от alemllm
    let response: string
    try {
      console.log('[VND] 🤖 Calling AlemLLM API...')
      console.log('[VND] 📝 System prompt length:', systemPrompt.length)
      console.log('[VND] 📝 User prompt length:', userPrompt.length)
      console.log('[VND] 📝 Total prompt length:', systemPrompt.length + userPrompt.length)
      
      response = await alemllm.complete(userPrompt, systemPrompt, {
        max_tokens: 2048,  // Уменьшено с 4096 до 2048
        temperature: 0.3
      })
      
      console.log('[VND] ✅ AlemLLM response received, length:', response.length)
    } catch (error) {
      console.error('[VND] ❌ AlemLLM API error:', error)
      return NextResponse.json({ 
        error: 'Ошибка при обращении к AlemLLM API' 
      }, { status: 503 })
    }

    console.log('[VND] ✅ Request completed successfully')
    return NextResponse.json({ response })

  } catch (error) {
    console.error('[VND] ❌ Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Произошла внутренняя ошибка сервера' 
    }, { status: 500 })
  }
}