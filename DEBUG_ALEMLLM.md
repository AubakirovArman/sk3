# 🔧 Инструкция по отладке AlemLLM API

## Проблема
API возвращает ошибку 400: "JSON decode error: Unterminated string"

## Быстрая диагностика

### Шаг 1: Проверить базовую связь
```bash
curl -X POST <YOUR_ALEMLLM_API_URL>/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "astanahub/alemllm",
    "messages": [{"role": "user", "content": "Test"}],
    "max_tokens": 10
  }'
```

### Шаг 2: Добавить логирование в alemllm.ts

Откройте `src/lib/alemllm.ts` и добавьте после строки с `fetch`:

```typescript
// В методе createChatCompletion, перед fetch:
console.log('🔍 AlemLLM Request:', JSON.stringify(requestBody, null, 2).substring(0, 500))

// После fetch:
const responseText = await response.text()
console.log('📥 AlemLLM Raw Response:', responseText.substring(0, 500))

if (!response.ok) {
  console.error('❌ AlemLLM Error:', response.status, responseText)
  throw new Error(`AlemLLM API error: ${response.status}`)
}

const data = JSON.parse(responseText)
```

### Шаг 3: Перезапустить и протестировать

```bash
# Остановить Next.js (Ctrl+C в терминале)
# Запустить снова
npm run dev

# В другом терминале
curl -X POST http://localhost:3000/api/vnd \
  -H "Content-Type: application/json" \
  -d '{"message":"тест"}'
```

### Шаг 4: Проверить логи

Смотрите вывод в терминале Next.js - там будут логи запроса и ответа.

## Возможные решения

### Решение 1: Уменьшить размер контекста

В `src/app/api/vnd/route.ts` и `src/app/api/np/route.ts`:

```typescript
// Ограничить длину контекста
if (context.length > 8000) {
  context = context.substring(0, 8000) + '\n...(текст обрезан)...'
}
```

### Решение 2: Экранировать спецсимволы

```typescript
// Функция для безопасного экранирования
function safeEscape(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}

// Применить к контексту
const safeContext = safeEscape(context)
```

### Решение 3: Использовать более короткий промпт

```typescript
const systemPrompt = `Ты эксперт по документам АО "Самрук-Қазына". Отвечай кратко и по делу.`

const userPrompt = hasContextFromDB 
  ? `Документы:\n${context}\n\nВопрос: ${message}`
  : `Вопрос: ${message}`
```

### Решение 4: Попробовать другие параметры

```typescript
const result = await alemllm.complete(userPrompt, systemPrompt, {
  max_tokens: 2048,  // Уменьшить
  temperature: 0.5,  // Уменьшить
  // Добавить другие параметры если поддерживаются
})
```

## Проверка статуса всех компонентов

```bash
# 1. Embedding Service
curl http://localhost:8001/health

# 2. Next.js
curl http://localhost:3000/api/vnd -X POST \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'

# 3. PostgreSQL VND
node test-vector-search.js

# 4. Python demo (работает!)
python3 demo_search.py
```

## Если ничего не помогает

### План Б: Временный fallback

В `src/lib/alemllm.ts` добавьте обработку ошибок:

```typescript
try {
  const response = await fetch(url, options)
  // ... существующий код
} catch (error) {
  console.error('AlemLLM API failed:', error)
  
  // Временный fallback - вернуть контекст как есть
  return {
    choices: [{
      message: {
        content: `Найденная информация:\n\n${context}\n\nПримечание: Сервис генерации ответов временно недоступен.`
      }
    }]
  }
}
```

### План В: Связаться с командой alemllm

1. Узнать актуальную документацию API
2. Проверить лимиты на размер запроса
3. Уточнить формат для кириллицы
4. Получить примеры working requests

## Контрольный список

- [ ] Embedding service работает (port 8001)
- [ ] Next.js запущен (port 3000)
- [ ] PostgreSQL доступна (<YOUR_DB_HOST>:5433)
- [ ] Векторный поиск находит документы (Python demo работает)
- [ ] Логирование добавлено в alemllm.ts
- [ ] Попробованы короткие промпты
- [ ] Попробовано уменьшение контекста
- [ ] Проверена документация alemllm

---

**Важно:** Векторные базы работают! Проблема только в финальной генерации ответа через AlemLLM API. Все остальное функционирует корректно.
