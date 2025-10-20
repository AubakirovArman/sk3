# 🔧 Fix: PDF Storage Lost on Hot Reload

## Проблема

```
[Download PDF] ❌ PDF not found: c793a7b56d83f355a5cfd3b5086f2d14
GET /api/download-pdf/c793a7b56d83f355a5cfd3b5086f2d14 404
```

PDF генерируется успешно, но при попытке скачать возвращается 404.

### Причина

В dev режиме Next.js использует **Hot Module Replacement (HMR)**. При любом изменении кода модули пересоздаются, и все переменные в памяти теряются.

**Было:**
```typescript
const pdfStorage = new Map<string, Buffer>()
```

При каждом hot reload эта Map пересоздавалась пустой! 🔄

---

## Решение

### Использовать глобальное хранилище

```typescript
// Глобальное хранилище, которое сохраняется между hot reloads
const globalForPdfStorage = globalThis as unknown as {
  pdfStorage: Map<string, Buffer> | undefined
}

const pdfStorage = globalForPdfStorage.pdfStorage ?? new Map<string, Buffer>()

if (process.env.NODE_ENV !== 'production') {
  globalForPdfStorage.pdfStorage = pdfStorage
}
```

**Как это работает:**

1. При первом импорте создаём Map
2. Сохраняем её в `globalThis` (только в dev режиме)
3. При следующем hot reload берём Map из `globalThis`
4. В production этого не происходит (не нужно)

---

## Добавлено логирование

### В `/api/export-pdf`:

```typescript
console.log('[Export PDF] ✅ PDF generated successfully', { 
  pdfId, 
  size: pdfBuffer.length, 
  totalStored: pdfStorage.size  // ← Количество PDF в storage
})
```

### В `/api/download-pdf/[id]`:

```typescript
console.log('[Download PDF] 📦 Total PDFs in storage:', pdfStorage.size)
console.log('[Download PDF] 🔑 Available IDs:', Array.from(pdfStorage.keys()))
```

---

## Как проверить

### 1. Генерируем PDF

```bash
# В браузере: нажать "Валидировать"
```

**Логи сервера:**
```
[Export PDF] ✅ PDF generated successfully { 
  pdfId: 'abc123...', 
  size: 226360, 
  totalStored: 1  ← Теперь видим количество!
}
```

### 2. Скачиваем PDF

```bash
# В браузере: нажать "Скачать PDF"
```

**Логи сервера:**
```
[Download PDF] 📦 Total PDFs in storage: 1
[Download PDF] 🔑 Available IDs: ['abc123...']
[Download PDF] 📥 Downloading PDF: abc123...
[Download PDF] ✅ PDF found, sending... { size: 226360 }
```

### 3. Делаем hot reload

```bash
# Измените любой файл (например, добавьте комментарий)
# Сохраните
# Next.js сделает hot reload
```

**Теперь storage НЕ очистится!** ✅

### 4. Снова скачиваем PDF

```bash
# Нажмите "Скачать PDF" ещё раз
```

**Должно работать!** ✅

---

## Альтернативные решения

### 1. Файловая система (для продакшна)

```typescript
import { writeFile, readFile } from 'fs/promises'
import { join } from 'path'

// Сохранение
const filePath = join(process.cwd(), 'tmp', `${pdfId}.pdf`)
await writeFile(filePath, pdfBuffer)

// Загрузка
const pdfBuffer = await readFile(filePath)
```

**Плюсы:**
- Не теряется при рестарте сервера
- Можно хранить долго

**Минусы:**
- Нужно очищать старые файлы
- Требует файловую систему

### 2. Redis (для продакшна)

```typescript
import { createClient } from 'redis'

const redis = createClient()

// Сохранение (TTL 1 час)
await redis.set(`pdf:${pdfId}`, pdfBuffer, { EX: 3600 })

// Загрузка
const pdfBuffer = await redis.get(`pdf:${pdfId}`)
```

**Плюсы:**
- Быстро
- Автоматическая очистка (TTL)
- Масштабируется

**Минусы:**
- Требует Redis сервер

### 3. S3 / Cloud Storage

```typescript
import { S3 } from 'aws-sdk'

const s3 = new S3()

// Сохранение
await s3.putObject({
  Bucket: 'my-pdfs',
  Key: `${pdfId}.pdf`,
  Body: pdfBuffer
})

// Загрузка
const { Body } = await s3.getObject({
  Bucket: 'my-pdfs',
  Key: `${pdfId}.pdf`
})
```

**Плюсы:**
- Надёжно
- Масштабируется
- Можно делать permanent links

**Минусы:**
- Стоит денег
- Требует настройку

---

## Когда использовать что?

| Вариант | Dev | Staging | Production |
|---------|-----|---------|------------|
| **globalThis** | ✅ Идеально | ⚠️ Ок | ❌ Нет |
| **Файловая система** | ✅ Ок | ✅ Хорошо | ⚠️ Ограничено |
| **Redis** | ⚠️ Сложно | ✅ Отлично | ✅ Отлично |
| **S3** | ❌ Нет | ✅ Хорошо | ✅ Идеально |

---

## Итог

✅ **Проблема решена для dev режима**

Теперь PDF не теряются при hot reload в development.

⚠️ **Для продакшна нужно использовать:**
- Файловую систему
- Redis
- S3

---

## Пример миграции на файлы

Создайте `src/lib/pdf-storage.ts`:

```typescript
import { writeFile, readFile, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

const PDF_DIR = join(process.cwd(), 'tmp', 'pdfs')

// Создать директорию если не существует
if (!existsSync(PDF_DIR)) {
  mkdirSync(PDF_DIR, { recursive: true })
}

export async function savePDF(id: string, buffer: Buffer): Promise<void> {
  const filePath = join(PDF_DIR, `${id}.pdf`)
  await writeFile(filePath, buffer)
  console.log('[PDF Storage] 💾 Saved:', id)
}

export async function loadPDF(id: string): Promise<Buffer | null> {
  const filePath = join(PDF_DIR, `${id}.pdf`)
  if (!existsSync(filePath)) {
    return null
  }
  return await readFile(filePath)
}

export async function deletePDF(id: string): Promise<void> {
  const filePath = join(PDF_DIR, `${id}.pdf`)
  if (existsSync(filePath)) {
    await unlink(filePath)
    console.log('[PDF Storage] 🗑️ Deleted:', id)
  }
}
```

Использование:

```typescript
// В export-pdf/route.ts
import { savePDF } from '@/lib/pdf-storage'
await savePDF(pdfId, pdfBuffer)

// В download-pdf/[id]/route.ts
import { loadPDF } from '@/lib/pdf-storage'
const pdfBuffer = await loadPDF(id)
```

---

**Дата:** 7 октября 2025 г.  
**Статус:** ✅ Исправлено для dev  
**TODO:** Миграция на файлы/Redis для продакшна
