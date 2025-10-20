# Embedding Service Guide

## 📋 Обзор

Embedding Service - это Python микросервис для генерации векторных представлений (эмбеддингов) текста с использованием модели BAAI/bge-m3.

### Основные характеристики

- **Модель:** BAAI/bge-m3
- **Размерность:** 1024
- **Порт:** 8001
- **Framework:** FastAPI + Uvicorn
- **Устройство:** MPS (Apple Silicon GPU) / CUDA / CPU

## 🚀 Запуск сервиса

### 1. Установка зависимостей

Перед первым запуском установите необходимые Python библиотеки:

```bash
pip install fastapi uvicorn sentence-transformers torch
```

### 2. Запуск сервиса

```bash
cd /Users/armanaubakirov/cks2/2/sk
python3 src/lib/embedding-service.py
```

Вывод при успешном запуске:
```
Loading BAAI/bge-m3 model...
Model loaded on device: mps
INFO:     Started server process [28629]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8001
```

### 3. Запуск в фоновом режиме

Для запуска в фоне (чтобы терминал оставался свободным):

```bash
# Запуск с перенаправлением логов
nohup python3 src/lib/embedding-service.py > embedding-service.log 2>&1 &

# Сохранить PID процесса
echo $! > embedding-service.pid
```

## 🔍 Проверка статуса

### Health Check

```bash
curl http://localhost:8001/health
```

Ожидаемый ответ:
```json
{
  "status": "healthy",
  "model": "BAAI/bge-m3",
  "device": "mps",
  "dimension": 1024
}
```

### Проверка работающего процесса

```bash
# Найти процесс на порту 8001
lsof -i :8001 -P -n

# Проверить детали процесса (замените PID на реальный)
ps -p <PID> -o pid,command

# Проверить рабочую директорию
lsof -p <PID> | grep cwd
```

Пример вывода:
```
COMMAND     PID           USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
python3.1 28629 armanaubakirov   19u  IPv4 0x88d2e2b85fa8bd95      0t0  TCP *:8001 (LISTEN)
```

## 📡 API Endpoints

### 1. POST /embed - Генерация эмбеддингов

**Request:**
```bash
curl -X POST http://localhost:8001/embed \
  -H "Content-Type: application/json" \
  -d '{
    "texts": ["Пример текста для эмбеддинга"],
    "normalize": true
  }'
```

**Response:**
```json
{
  "embeddings": [
    [0.123, -0.456, 0.789, ...]
  ],
  "model": "BAAI/bge-m3",
  "dimension": 1024
}
```

**Параметры:**
- `texts` (обязательный): Массив текстов (макс. 100)
- `normalize` (опциональный): Нормализация векторов (по умолчанию `true`)

### 2. GET /health - Проверка здоровья

```bash
curl http://localhost:8001/health
```

## 🛠️ Управление сервисом

### Остановка сервиса

**Если известен PID:**
```bash
kill 28629
```

**Если PID неизвестен:**
```bash
# Найти PID
PID=$(lsof -ti :8001)

# Остановить
kill $PID
```

**Если запущен через nohup:**
```bash
# Прочитать PID из файла
kill $(cat embedding-service.pid)
rm embedding-service.pid
```

### Перезапуск сервиса

```bash
# Остановить
kill $(lsof -ti :8001)

# Подождать 2 секунды
sleep 2

# Запустить снова
cd /Users/armanaubakirov/cks2/2/sk
python3 src/lib/embedding-service.py
```

### Просмотр логов (при запуске через nohup)

```bash
tail -f embedding-service.log
```

## 🔗 Интеграция с Next.js

### Переменная окружения

В `.env.local`:
```bash
EMBEDDING_SERVICE_URL="http://localhost:8001"
```

### Использование в коде

**TypeScript клиент** (`src/lib/embedding-client.ts`):
```typescript
import { embeddingClient } from '@/lib/embedding-client'

// Генерация эмбеддинга
const embeddings = await embeddingClient.embed(['Текст для анализа'])
console.log(embeddings) // [Array(1024)]
```

**Пример в API route:**
```typescript
import { embeddingClient } from '@/lib/embedding-client'

export async function POST(request: NextRequest) {
  const { text } = await request.json()
  
  // Получить эмбеддинг
  const [embedding] = await embeddingClient.embed([text])
  
  // Использовать для поиска в векторной БД
  // ...
}
```

## ⚙️ Конфигурация

### Изменение порта

Отредактируйте `src/lib/embedding-service.py`:

```python
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)  # Новый порт
```

Не забудьте обновить `.env.local`:
```bash
EMBEDDING_SERVICE_URL="http://localhost:8002"
```

### Изменение модели

```python
# В src/lib/embedding-service.py
model = SentenceTransformer("BAAI/bge-m3")  # Замените на другую модель
```

### Настройка устройства

По умолчанию автоматический выбор:
1. MPS (Apple Silicon) - если доступен
2. CUDA (NVIDIA GPU) - если доступен
3. CPU - fallback

Для принудительного использования CPU:
```python
device = torch.device("cpu")
model = SentenceTransformer("BAAI/bge-m3", device=device)
```

## 🐛 Troubleshooting

### Проблема: Порт уже занят

**Ошибка:**
```
OSError: [Errno 48] Address already in use
```

**Решение:**
```bash
# Найти и остановить процесс
kill $(lsof -ti :8001)

# Или изменить порт в коде
```

### Проблема: Модель не загружается

**Ошибка:**
```
OSError: Can't load model for 'BAAI/bge-m3'
```

**Решение:**
```bash
# Загрузить модель вручную
python3 -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('BAAI/bge-m3')"
```

Модель займет ~2GB дискового пространства.

### Проблема: Сервис недоступен

**Проверка:**
```bash
curl http://localhost:8001/health
```

**Если не отвечает:**
1. Проверьте, запущен ли процесс: `lsof -i :8001`
2. Проверьте логи (если используется nohup): `tail embedding-service.log`
3. Перезапустите сервис

### Проблема: MPS недоступен на Mac

**Ошибка:**
```
RuntimeError: MPS backend out of memory
```

**Решение:**
```python
# Принудительно использовать CPU
device = torch.device("cpu")
```

## 📊 Производительность

### Время генерации эмбеддингов

| Устройство | 1 текст | 10 текстов | 100 текстов |
|-----------|---------|-----------|-------------|
| MPS (M1)  | ~50ms   | ~200ms    | ~1500ms     |
| CUDA      | ~30ms   | ~150ms    | ~1000ms     |
| CPU       | ~200ms  | ~1000ms   | ~8000ms     |

### Оптимизация

1. **Batch обработка** - отправляйте несколько текстов за раз
2. **Кэширование** - сохраняйте эмбеддинги для часто используемых текстов
3. **Используйте GPU** - MPS или CUDA значительно быстрее CPU

## 🔒 Безопасность

### Рекомендации для production

1. **Не используйте `0.0.0.0`** - привяжите к localhost:
   ```python
   uvicorn.run(app, host="127.0.0.1", port=8001)
   ```

2. **Добавьте аутентификацию** - используйте API ключи:
   ```python
   from fastapi import Header, HTTPException
   
   async def verify_token(x_api_key: str = Header(...)):
       if x_api_key != "your-secret-key":
           raise HTTPException(status_code=401)
   
   @app.post("/embed", dependencies=[Depends(verify_token)])
   async def create_embeddings(request: EmbeddingRequest):
       # ...
   ```

3. **Rate limiting** - ограничьте количество запросов
4. **HTTPS** - используйте reverse proxy (nginx) с SSL

## 📚 Дополнительные ресурсы

- [BAAI/bge-m3 на HuggingFace](https://huggingface.co/BAAI/bge-m3)
- [FastAPI документация](https://fastapi.tiangolo.com/)
- [Sentence Transformers](https://www.sbert.net/)
- [PyTorch MPS Backend](https://pytorch.org/docs/stable/notes/mps.html)

## ✅ Checklist для запуска

- [ ] Установлены зависимости: `fastapi`, `uvicorn`, `sentence-transformers`, `torch`
- [ ] Модель BAAI/bge-m3 загружена (~2GB)
- [ ] Порт 8001 свободен
- [ ] Сервис запущен: `python3 src/lib/embedding-service.py`
- [ ] Health check работает: `curl http://localhost:8001/health`
- [ ] Переменная `EMBEDDING_SERVICE_URL` установлена в `.env.local`
- [ ] Next.js приложение может обращаться к сервису

---

**Создано:** 5 октября 2025  
**Версия:** 1.0  
**Статус:** ✅ Production Ready
