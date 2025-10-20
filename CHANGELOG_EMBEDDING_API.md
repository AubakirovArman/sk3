# Changelog: External BGE-M3 Embedding API

## [7 октября 2025] - Миграция на внешний API

### 🔄 Changed

#### `src/lib/embedding-client.ts`
- **Endpoint:** `http://localhost:8001/embed` → `https://bge-m3.sk-ai.kz/encode`
- **Default URL:** Changed constructor default to external API
- **Request format:** 
  - Параметр `normalize` → `return_dense` (boolean)
  - Добавлены опциональные `return_sparse`, `return_colbert_vecs`
- **Response format:**
  - Поле `embeddings` → `dense_vecs` (число[][]
  - Добавлена обработка ошибки "No dense embeddings returned"
- **Health check:** Теперь использует `/encode` endpoint (нет `/health`)

#### Environment файлы
- `.env`: `EMBEDDING_SERVICE_URL` → `"https://bge-m3.sk-ai.kz"`
- `.env.local`: Аналогично
- `.env.example`: Аналогично

### ✅ Added

#### Новые файлы
- **`test-embedding-api.js`** - Тестовый скрипт для проверки API
  - 4 теста: single text, batch, multilingual, performance
  - Проверка структуры ответа (`dense_vecs`)
  - Проверка размерности (1024)
  - Проверка мультиязычности (en/ru/kk)

#### Документация
- **`EXTERNAL_EMBEDDING_API_MIGRATION.md`** - Полное руководство миграции
  - Сравнение старого и нового API
  - Примеры запросов/ответов
  - Troubleshooting
  - Checklist миграции

- **`MIGRATION_EMBEDDING_SUMMARY.md`** - Краткая инструкция
  - Быстрый старт для разработчиков
  - Основные преимущества
  - Команды для миграции

### ❌ Removed

#### Зависимости (больше не нужны)
- Локальный Python сервис (`embedding-service.py`)
- Зависимость от PyTorch
- Зависимость от sentence-transformers
- Необходимость локальной модели (3.5 GB)

### 🐛 Fixed

#### API Compatibility
- Исправлено название поля: `dense` → `dense_vecs`
- Добавлена проверка наличия `dense_vecs` в ответе
- Обновлены TypeScript типы

---

## API Changes Summary

### Request

**Было:**
```json
{
  "texts": ["text1", "text2"],
  "normalize": true
}
```

**Стало:**
```json
{
  "texts": ["text1", "text2"],
  "return_dense": true,
  "return_sparse": false,
  "return_colbert_vecs": false
}
```

### Response

**Было:**
```json
{
  "embeddings": [[...], [...]],
  "model": "BAAI/bge-m3",
  "dimension": 1024
}
```

**Стало:**
```json
{
  "dense_vecs": [[...], [...]],
  "lexical_weights": [...],
  "colbert_vecs": [...]
}
```

---

## Тесты

### Результаты `test-embedding-api.js`
```
✅ API endpoint: Working
✅ Response format: Correct (dense_vecs)
✅ Embedding dimension: 1024
✅ Batch processing: Supported
✅ Multilingual: Supported (en/ru/kk)
✅ Performance: Fast (avg 19.70ms per text)
```

---

## Breaking Changes

### ⚠️ NONE для пользователей клиента

Публичный API `EmbeddingClient` не изменился:
```typescript
// ✅ Всё это работает так же
await embeddingClient.embed(['text1', 'text2'])
await embeddingClient.embedSingle('text')
await embeddingClient.healthCheck()
```

### ⚠️ Только для прямых вызовов API

Если вы вызывали embedding API напрямую (не через клиент):
- Измените endpoint: `/embed` → `/encode`
- Измените параметр: `normalize` → `return_dense`
- Измените поле ответа: `embeddings` → `dense_vecs`

---

## Migration Checklist

- [x] Обновлён `embedding-client.ts`
  - [x] Endpoint: `/embed` → `/encode`
  - [x] Request: `normalize` → `return_dense`
  - [x] Response: `embeddings` → `dense_vecs`
  - [x] Default URL: внешний API

- [x] Обновлены env файлы
  - [x] `.env`
  - [x] `.env.local`
  - [x] `.env.example`

- [x] Добавлены тесты
  - [x] `test-embedding-api.js`
  - [x] Все 4 теста проходят

- [x] Документация
  - [x] Полное руководство миграции
  - [x] Краткая инструкция
  - [x] Changelog

- [x] Проверка
  - [x] TypeScript компиляция: ✅ No errors
  - [x] API тестирование: ✅ All passed
  - [x] Мультиязычность: ✅ en/ru/kk

---

## Performance Comparison

| Метрика | Локальный | Внешний |
|---------|-----------|---------|
| Startup time | ~15-20 сек (загрузка модели) | 0 сек |
| First request | ~1-2 сек | ~0.02 сек |
| Subsequent | ~0.5-1 сек | ~0.02 сек |
| Batch (10 texts) | ~2-3 сек | ~0.2 сек |
| Memory | ~4-5 GB (модель + PyTorch) | ~0 (клиент) |
| Disk space | ~3.5 GB (модель) | ~0 |

**Вывод:** Внешний API быстрее и легче! 🚀

---

## Rollback Plan

Если нужно вернуться на локальный сервис:

### 1. Откатить `embedding-client.ts`
```bash
git checkout HEAD~1 src/lib/embedding-client.ts
```

### 2. Изменить `.env.local`
```bash
EMBEDDING_SERVICE_URL="http://localhost:8001"
```

### 3. Запустить Python сервис
```bash
python3 src/lib/embedding-service.py
```

---

## Future Enhancements

Возможные улучшения:

### 1. Sparse Embeddings
```typescript
// Для BM25-подобного поиска
const embeddings = await embeddingClient.embedWithSparse(texts)
// { dense_vecs, lexical_weights }
```

### 2. ColBERT Vectors
```typescript
// Для re-ranking
const embeddings = await embeddingClient.embedWithColBERT(texts)
// { dense_vecs, colbert_vecs }
```

### 3. Caching
```typescript
// Кэширование эмбеддингов
const cache = new EmbeddingCache()
const embeddings = await cache.getOrGenerate(texts)
```

---

**Автор:** AI Assistant  
**Дата:** 7 октября 2025 г.  
**Версия:** 1.0.0
