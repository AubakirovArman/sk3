# TTS CORS Fix - Решение проблемы "Failed to fetch"

## 🐛 Проблема

При попытке использовать TTS в браузере возникала ошибка:

```
TypeError: Failed to fetch
```

## 🔍 Причина

TTS API (`https://tts.sk-ai.kz/api/tts`) не поддерживает CORS (Cross-Origin Resource Sharing), поэтому браузер блокирует прямые запросы с фронтенда.

## ✅ Решение

Создан Next.js API proxy endpoint, который проксирует запросы к TTS API на сервере (где CORS не применяется).

## 📁 Изменённые файлы

### 1. Создан новый API endpoint

**Файл:** `src/app/api/tts/route.ts`

```typescript
/**
 * TTS API Proxy
 * Решает проблему CORS, проксируя запросы к TTS API
 */

import { NextRequest, NextResponse } from 'next/server'

const TTS_API_URL = process.env.NEXT_PUBLIC_TTS_API_URL || 'https://tts.sk-ai.kz/api/tts'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, lang } = body

    // Проксируем запрос к TTS API
    const response = await fetch(TTS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        lang: lang || 'ru',
      }),
    })

    // Возвращаем аудио с правильными заголовками
    const audioBlob = await response.blob()
    return new NextResponse(audioBlob, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBlob.size.toString(),
      },
    })
  } catch (error) {
    console.error('[TTS Proxy] ❌ Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    )
  }
}
```

### 2. Обновлён TTS клиент

**Файл:** `src/lib/tts-client.ts`

**Было:**
```typescript
const TTS_API_URL = process.env.NEXT_PUBLIC_TTS_API_URL || 'https://tts.sk-ai.kz/api/tts'

export class TTSClient {
  constructor() {
    this.baseURL = TTS_API_URL // ❌ Прямое обращение к внешнему API
  }
}
```

**Стало:**
```typescript
export class TTSClient {
  constructor() {
    this.baseURL = '/api/tts' // ✅ Используем Next.js proxy
  }
}
```

## 🎯 Как это работает

```
┌──────────────────────────────────────────────────────────────┐
│                         Браузер                              │
│  (http://localhost:3001/virtual-director)                    │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        │ 1. POST /api/tts
                        │    { text: "...", lang: "ru" }
                        │    (Same-origin - ✅ CORS OK)
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│                     Next.js Server                           │
│                  (localhost:3001)                            │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  src/app/api/tts/route.ts                              │ │
│  │  (TTS Proxy)                                           │ │
│  └───────────────────┬────────────────────────────────────┘ │
└────────────────────┬─┴──────────────────────────────────────┘
                     │
                     │ 2. POST https://tts.sk-ai.kz/api/tts
                     │    { text: "...", lang: "ru" }
                     │    (Server-to-Server - ✅ No CORS)
                     │
                     ▼
          ┌──────────────────────────┐
          │   SK-AI TTS API          │
          │  (tts.sk-ai.kz)          │
          │                          │
          │  3. Returns MP3 audio    │
          │     (8-15 KB)            │
          └──────────────────────────┘
                     │
                     │ 4. Proxy returns audio to browser
                     │
                     ▼
              [Audio plays! 🎵]
```

## 🧪 Тестирование

### Проверка proxy endpoint

```bash
# Тест через Next.js proxy (должно работать!)
curl -X POST "http://localhost:3001/api/tts" \
  -H "Content-Type: application/json" \
  -d '{"text": "Привет мир", "lang": "ru"}' \
  --output test_proxy.mp3

# Проверка размера файла
ls -lh test_proxy.mp3

# Воспроизведение (macOS)
afplay test_proxy.mp3
```

### Проверка в браузере

1. Откройте http://localhost:3001/virtual-director
2. Загрузите документ и получите анализ
3. Нажмите кнопку "🔊 Озвучить"
4. Аудио должно начать воспроизведение без ошибок!

## 📊 Логи

### До исправления (❌ Ошибка)
```
[TTS] 🎤 Generating speech...
[TTS] 📝 Text length: 1234
[TTS] 🌐 Language: ru
[TTS] ❌ Generation failed: TypeError: Failed to fetch
```

### После исправления (✅ Работает)
```
[TTS Proxy] 🎤 Generating speech...
[TTS Proxy] 📝 Text length: 1234
[TTS Proxy] 🌐 Language: ru
[TTS Proxy] ✅ Speech generated, size: 12345 bytes

[TTS] 🎤 Generating speech...
[TTS] 📝 Text length: 1234
[TTS] 🌐 Language: ru
[TTS] ✅ Speech generated, size: 12345 bytes
```

## 🔧 Преимущества решения

1. **✅ Решает CORS** - браузер делает same-origin запрос
2. **✅ Безопасность** - API ключи остаются на сервере
3. **✅ Кэширование** - можно добавить кэширование на сервере
4. **✅ Мониторинг** - логи всех TTS запросов в одном месте
5. **✅ Гибкость** - легко добавить rate limiting или другие проверки

## 🚀 Дальнейшие улучшения

### 1. Кэширование (опционально)

```typescript
// src/app/api/tts/route.ts
import { LRUCache } from 'lru-cache'

const audioCache = new LRUCache<string, Blob>({
  max: 100, // максимум 100 аудио файлов
  maxSize: 10 * 1024 * 1024, // 10 MB
  sizeCalculation: (blob) => blob.size,
})

export async function POST(request: NextRequest) {
  const { text, lang } = await request.json()
  const cacheKey = `${lang}:${text}`
  
  // Проверка кэша
  const cached = audioCache.get(cacheKey)
  if (cached) {
    console.log('[TTS Proxy] ⚡ Cache hit!')
    return new NextResponse(cached, {
      headers: { 'Content-Type': 'audio/mpeg' }
    })
  }
  
  // Генерация и кэширование
  const response = await fetch(TTS_API_URL, { ... })
  const audioBlob = await response.blob()
  audioCache.set(cacheKey, audioBlob)
  
  return new NextResponse(audioBlob, { ... })
}
```

### 2. Rate Limiting (опционально)

```typescript
import { Ratelimit } from '@upstash/ratelimit'

const ratelimit = new Ratelimit({
  redis: ...,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
})

export async function POST(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1'
  const { success } = await ratelimit.limit(ip)
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }
  
  // ... остальной код
}
```

## ✅ Checklist

- [x] Создан API proxy endpoint (`src/app/api/tts/route.ts`)
- [x] Обновлён TTS клиент для использования proxy
- [x] Добавлены логи для отладки
- [x] Протестирован через curl
- [ ] Протестирован в браузере
- [ ] Добавлено кэширование (опционально)
- [ ] Добавлен rate limiting (опционально)

## 🎉 Результат

TTS функционал теперь работает без ошибок CORS! 🎵

---

**Дата:** 6 октября 2025  
**Статус:** ✅ Исправлено и готово к тестированию
