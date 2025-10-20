import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST - генерировать похожие вопросы с помощью LLM
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { question, language = 'ru', count = 5 } = body

    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Question is required' },
        { status: 400 }
      )
    }

    // Формируем промпт для генерации похожих вопросов
    const languageNames: Record<string, string> = {
      ru: 'русском',
      kk: 'казахском',
      en: 'английском'
    }

    const prompt = `Сгенерируй ${count} вариантов вопроса, похожих по смыслу на: "${question}"

Требования:
- Вопросы должны быть на ${languageNames[language] || 'русском'} языке
- Вопросы должны иметь тот же смысл, но разную формулировку
- Включи различные способы задать вопрос: формальные, неформальные, краткие, развернутые
- Каждый вопрос на новой строке
- Только вопросы без нумерации и дополнительного текста

Примеры для "Кто ты?":
Кто ты такой
Что ты за система
Представься пожалуйста
Расскажи о себе
Какая ты система

Теперь сгенерируй похожие варианты для заданного вопроса:`

    // Вызываем LLM API
    const alemllmResponse = await fetch('https://alemllm.sk-ai.kz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'astanahub/alemllm',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 500
      })
    })

    if (!alemllmResponse.ok) {
      throw new Error('Failed to generate similar questions')
    }

    const alemllmData = await alemllmResponse.json()
    const generatedText = alemllmData.choices?.[0]?.message?.content || ''

    // Парсим сгенерированные вопросы (каждый на новой строке)
    const similarQuestions = generatedText
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0 && !line.match(/^\d+[\.\)]/)) // убираем нумерацию
      .slice(0, count)

    return NextResponse.json({
      success: true,
      similarQuestions
    })
  } catch (error) {
    console.error('[Generate Similar Questions] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
