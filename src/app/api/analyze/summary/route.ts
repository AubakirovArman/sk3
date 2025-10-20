import { NextRequest, NextResponse } from 'next/server'
import { alemllm } from '@/lib/alemllm'

export async function POST(request: NextRequest) {
  try {
    const { vndResult, npResult, language = 'ru' } = await request.json()
    
    if (!vndResult || !npResult) {
      return NextResponse.json(
        { error: 'Для формирования итогового заключения необходимо предоставить результаты ВНД и НП анализа' }, 
        { status: 400 }
      )
    }

    // Валидация языка
    const validLanguages = ['ru', 'kk', 'en']
    const targetLang = validLanguages.includes(language) ? language : 'ru'

    // Промпты на разных языках
    const languageInstructions = {
      ru: {
        system: `Ты профессиональный независимый эксперт-аналитик Совета директоров АО «Самрук-Қазына».

Структура ответа (строго):
**ПУНКТ ПОВЕСТКИ ДНЯ:** <название>
**РЕШЕНИЕ НЕЗАВИСИМОГО ЧЛЕНА СД:** ЗА | ПРОТИВ | ВОЗДЕРЖАЛСЯ
**КРАТКОЕ ЗАКЛЮЧЕНИЕ:** (5-8 предложений)

**ОБОСНОВАНИЕ:**
- **Контекст и выводы:** (15-25 предложений)
- **Риски:** (10-15 пунктов)
- **Рекомендации:** (8-12 пунктов)
- **Источники:** (15-25 ссылок)

Минимум 2000-3000 слов. Используй только информацию из предоставленных анализов.`,
        user: `На основе следующих анализов прими решение как виртуальный директор:

ВНД Анализ:
${vndResult}

НП Анализ:
${npResult}

Сформируй ответ строго в требуемой структуре.`
      },
      kk: {
        system: `Сіз «Самұрық-Қазына» АҚ Директорлар кеңесінің кәсіби тәуелсіз сарапшы-талдаушысыз.

Жауап құрылымы (қатаң):
**КҮН ТӘРТІБІНІҢ ТАРМАҒЫ:** <атауы>
**ДК ТӘУЕЛСІЗ МҮШЕСІНІҢ ШЕШІМІ:** ЖАҚ | ҚАРСЫ | БЕЙТАРАП ҚАЛДЫ
**ҚЫСҚАША ҚОРЫТЫНДЫ:** (5-8 сөйлем)

**НЕГІЗДЕМЕ:**
- **Контекст және қорытындылар:** (15-25 сөйлем)
- **Тәуекелдер:** (10-15 тармақ)
- **Ұсыныстар:** (8-12 тармақ)
- **Дереккөздер:** (15-25 сілтеме)

Кемінде 2000-3000 сөз. Тек ұсынылған талдаулардан алынған ақпаратты пайдаланыңыз.`,
        user: `Келесі талдауларға негізделе отырып, виртуалды директор ретінде шешім қабылдаңыз:

ІНҚ Талдауы:
${vndResult}

ҚБА Талдауы:
${npResult}

Жауапты қатаң талап етілген құрылымда жасаңыз.`
      },
      en: {
        system: `You are a professional independent expert-analyst of the Board of Directors of JSC "Samruk-Kazyna".

Response structure (strict):
**AGENDA ITEM:** <name>
**DECISION OF INDEPENDENT BOARD MEMBER:** FOR | AGAINST | ABSTAINED
**BRIEF CONCLUSION:** (5-8 sentences)

**JUSTIFICATION:**
- **Context and conclusions:** (15-25 sentences)
- **Risks:** (10-15 points)
- **Recommendations:** (8-12 points)
- **Sources:** (15-25 references)

Minimum 2000-3000 words. Use only information from provided analyses.`,
        user: `Based on the following analyses, make a decision as a virtual director:

ICD Analysis:
${vndResult}

RLA Analysis:
${npResult}

Formulate response strictly in required structure.`
      }
    }

    const prompts = languageInstructions[targetLang as keyof typeof languageInstructions]
    const systemPrompt = prompts.system
    const userPrompt = prompts.user

    const result = await alemllm.complete(userPrompt, systemPrompt, { max_tokens: 8096, temperature: 0.7 })

    return NextResponse.json({ success: true, result })

  } catch (error) {
    console.error('Ошибка итогового заключения:', error)
    const msg = error instanceof Error ? error.message : 'Ошибка'
    
    if (msg.includes('AlemLLM')) {
      return NextResponse.json({ 
        error: 'Ошибка при обращении к AlemLLM API' 
      }, { status: 503 })
    }

    return NextResponse.json({ 
      error: 'Произошла ошибка при формировании заключения' 
    }, { status: 500 })
  }
}
