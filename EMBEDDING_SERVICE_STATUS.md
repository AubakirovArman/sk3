# 🟢 Embedding Service - Текущий статус

## ✅ Сервис запущен и работает

```
PID:      28629
Команда:  python3 src/lib/embedding-service.py
Директория: /Users/armanaubakirov/cks2/2/sk
Порт:     8001 (слушает на *:8001)
Устройство: mps (Apple Silicon GPU)
Модель:   BAAI/bge-m3
Размерность: 1024
```

## 🔍 Проверка статуса

### Health Check
```bash
curl http://localhost:8001/health
```

**Ожидаемый ответ:**
```json
{
  "status": "healthy",
  "model": "BAAI/bge-m3",
  "device": "mps",
  "dimension": 1024
}
```

### Найти процесс
```bash
lsof -i :8001 -P -n
```

**Текущий вывод:**
```
COMMAND     PID           USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
python3.1 28629 armanaubakirov   19u  IPv4 0x88d2e2b85fa8bd95      0t0  TCP *:8001 (LISTEN)
```

## 🛠️ Управление сервисом

### Перезапуск
```bash
# Остановить текущий процесс
kill 28629

# Запустить снова
cd /Users/armanaubakirov/cks2/2/sk
python3 src/lib/embedding-service.py
```

### Остановка
```bash
kill 28629
```

### Просмотр логов (если запущен через nohup)
```bash
tail -f embedding-service.log
```

## 📊 Производительность (MPS - Apple Silicon)

| Операция | Время |
|----------|-------|
| 1 текст  | ~50ms |
| 10 текстов | ~200ms |
| 100 текстов | ~1500ms |

## 🔗 Использование в проекте

Сервис используется в:
- `src/lib/embedding-client.ts` - TypeScript клиент
- `src/lib/vector-db.ts` - Поиск по векторным БД
- `src/app/api/analyze/vnd/route.ts` - ВНД анализ
- `src/app/api/analyze/np/route.ts` - НПА анализ

## 📚 Документация

Полное руководство: [EMBEDDING_SERVICE_GUIDE.md](./EMBEDDING_SERVICE_GUIDE.md)

---

**Обновлено:** 5 октября 2025  
**Статус:** 🟢 Работает
