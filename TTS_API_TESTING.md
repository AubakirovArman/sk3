# 🎤 TTS API - Результаты тестирования

## 📋 Обзор

**API Endpoint:** `https://tts.sk-ai.kz/api/tts`  
**Метод:** POST  
**Дата тестирования:** 6 октября 2025

## ✅ Результаты тестов

### Тест 1: Казахский язык (kk)

**Запрос:**
```json
{
  "text": "Сәлем, қалайсың?",
  "lang": "kk"
}
```

**Ответ:**
- ✅ Статус: 200 OK
- 📦 Content-Type: `audio/mpeg`
- 📏 Размер: 11,808 bytes (~12 KB)
- 🎵 Формат: MPEG ADTS, layer III, v2, 48 kbps, 24 kHz, Monaural
- 📁 Имя файла: `abbf539e-8520-4033-b70d-5a1e8c57a627.mp3`

### Тест 2: Русский язык (ru)

**Запрос:**
```json
{
  "text": "Привет, как дела?",
  "lang": "ru"
}
```

**Ответ:**
- ✅ Статус: 200 OK
- 📦 Content-Type: `audio/mpeg`
- 📏 Размер: 13,968 bytes (~14 KB)
- 🎵 Формат: MPEG ADTS, layer III, v2, 48 kbps, 24 kHz, Monaural
- 📁 Имя файла: `82fbfb83-8a12-42c9-9b73-fd4800c15eee.mp3`

## 📊 Анализ

### Что получаем:

1. **Формат аудио:** MP3 (MPEG ADTS Layer III)
2. **Качество:** 48 kbps, 24 kHz, Mono
3. **Content-Disposition:** `attachment; filename="<uuid>.mp3"`
4. **Размер:** ~1 KB на символ (приблизительно)
5. **Скорость:** ~1-2 секунды на генерацию

### Заголовки ответа:

```
Content-Type: audio/mpeg
Accept-Ranges: bytes
Content-Disposition: attachment; filename="<uuid>.mp3"
Content-Length: <size>
Last-Modified: <timestamp>
ETag: "<hash>"
```

## 🔧 Как использовать

### Python

```python
import requests

def get_tts(text: str, lang: str = "ru") -> bytes:
    """
    Получить озвучку текста
    
    Args:
        text: Текст для озвучки
        lang: Язык (kk - казахский, ru - русский)
    
    Returns:
        bytes: MP3 аудио файл
    """
    response = requests.post(
        "https://tts.sk-ai.kz/api/tts",
        json={"text": text, "lang": lang},
        timeout=30
    )
    
    if response.status_code == 200:
        return response.content
    else:
        raise Exception(f"TTS API error: {response.status_code}")

# Использование
audio_data = get_tts("Привет, мир!", "ru")

# Сохранить в файл
with open("output.mp3", "wb") as f:
    f.write(audio_data)
```

### JavaScript/TypeScript

```typescript
async function getTTS(text: string, lang: string = "ru"): Promise<Blob> {
  const response = await fetch("https://tts.sk-ai.kz/api/tts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, lang }),
  });

  if (!response.ok) {
    throw new Error(`TTS API error: ${response.status}`);
  }

  return await response.blob();
}

// Использование
const audioBlob = await getTTS("Привет, мир!", "ru");

// Создать URL для воспроизведения
const audioUrl = URL.createObjectURL(audioBlob);
const audio = new Audio(audioUrl);
audio.play();
```

### cURL

```bash
# Казахский язык
curl -X POST "https://tts.sk-ai.kz/api/tts" \
  -H "Content-Type: application/json" \
  -d '{"text":"Сәлем, қалайсың?","lang":"kk"}' \
  -o output.mp3

# Русский язык
curl -X POST "https://tts.sk-ai.kz/api/tts" \
  -H "Content-Type: application/json" \
  -d '{"text":"Привет, как дела?","lang":"ru"}' \
  -o output.mp3
```

## 🎯 Интеграция в SKAI

### 1. Создать TTS клиент

**Файл:** `src/lib/tts-client.ts`

```typescript
/**
 * TTS API Client for SK-AI TTS Service
 */

const TTS_API_URL = process.env.TTS_API_URL || 'https://tts.sk-ai.kz/api/tts'

export interface TTSRequest {
  text: string
  lang: 'kk' | 'ru'
}

export class TTSClient {
  private baseURL: string

  constructor() {
    this.baseURL = TTS_API_URL
  }

  /**
   * Generate speech from text
   */
  async generateSpeech(text: string, lang: 'kk' | 'ru' = 'ru'): Promise<Blob> {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, lang }),
      })

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`)
      }

      return await response.blob()
    } catch (error) {
      console.error('TTS generation failed:', error)
      throw error
    }
  }

  /**
   * Generate speech and return as base64
   */
  async generateSpeechBase64(text: string, lang: 'kk' | 'ru' = 'ru'): Promise<string> {
    const blob = await this.generateSpeech(text, lang)
    const buffer = await blob.arrayBuffer()
    return Buffer.from(buffer).toString('base64')
  }
}

// Export singleton instance
export const ttsClient = new TTSClient()
```

### 2. Создать API endpoint

**Файл:** `src/app/api/tts/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { ttsClient } from '@/lib/tts-client'

export async function POST(request: NextRequest) {
  try {
    const { text, lang } = await request.json()

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    if (lang && !['kk', 'ru'].includes(lang)) {
      return NextResponse.json(
        { error: 'Invalid language. Use "kk" or "ru"' },
        { status: 400 }
      )
    }

    // Генерируем аудио
    const audioBlob = await ttsClient.generateSpeech(text, lang || 'ru')
    
    // Конвертируем в Buffer
    const buffer = await audioBlob.arrayBuffer()

    // Возвращаем аудио файл
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="speech.mp3"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    })

  } catch (error) {
    console.error('TTS API Error:', error)
    return NextResponse.json(
      { error: 'Ошибка генерации аудио' },
      { status: 500 }
    )
  }
}
```

### 3. Добавить в UI

**Кнопка озвучки в чате:**

```typescript
const handlePlayAudio = async (text: string) => {
  try {
    setIsGeneratingAudio(true)
    
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, lang: 'ru' }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate audio')
    }

    const blob = await response.blob()
    const audioUrl = URL.createObjectURL(blob)
    
    const audio = new Audio(audioUrl)
    audio.play()
    
  } catch (error) {
    console.error('Audio generation error:', error)
    alert('Ошибка при генерации аудио')
  } finally {
    setIsGeneratingAudio(false)
  }
}

// В JSX
<button onClick={() => handlePlayAudio(message.text)}>
  🔊 Озвучить
</button>
```

## 📝 Переменные окружения

Добавить в `.env.local`:

```bash
# TTS Service
TTS_API_URL="https://tts.sk-ai.kz/api/tts"
```

## ⚙️ Настройки и ограничения

### Поддерживаемые языки:
- `kk` - Казахский
- `ru` - Русский

### Технические характеристики:
- Формат: MP3 (MPEG Layer III)
- Битрейт: 48 kbps
- Частота дискретизации: 24 kHz
- Каналы: Mono

### Ограничения (требуют проверки):
- Максимальная длина текста: ?
- Rate limit: ?
- Timeout: Рекомендуется 30 секунд

## 🧪 Тестовые скрипты

В проекте доступны:

1. **`test_tts_api.py`** - Python скрипт с детальным логированием
2. **`test_tts_api.sh`** - Bash скрипт для быстрого теста

**Запуск:**
```bash
# Python
python3 test_tts_api.py

# Bash
./test_tts_api.sh
```

## 📚 Следующие шаги

1. ✅ Протестировать API - **Готово**
2. ⏳ Создать TTS клиент (`src/lib/tts-client.ts`)
3. ⏳ Создать API endpoint (`src/app/api/tts/route.ts`)
4. ⏳ Добавить кнопки озвучки в UI
5. ⏳ Протестировать интеграцию
6. ⏳ Добавить кэширование аудио (опционально)

---

**Протестировано:** 6 октября 2025  
**Статус:** ✅ API работает корректно  
**Формат:** MP3, 48 kbps, 24 kHz, Mono
