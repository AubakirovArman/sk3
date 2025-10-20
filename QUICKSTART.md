# 🚀 Быстрый старт системы

## Запуск в 3 шага

### 1. Запустить Embedding Service

**Простой запуск:**
```bash
cd /Users/armanaubakirov/cks2/2/sk
python3 src/lib/embedding-service.py
```
Ждем: `Application startup complete.`

**Запуск в фоне:**
```bash
nohup python3 src/lib/embedding-service.py > embedding-service.log 2>&1 &
echo $! > embedding-service.pid
```

**Проверка:**
```bash
# Проверить статус
curl http://localhost:8001/health

# Найти процесс
lsof -i :8001 -P -n
```

📚 **Подробнее:** [EMBEDDING_SERVICE_GUIDE.md](./EMBEDDING_SERVICE_GUIDE.md)

### 2. Запустить Next.js
```bash
npm run dev
```
Ждем: `✓ Ready in 2s`

### 3. Тест
```bash
./test-api.sh
```

---

## Проверка статуса

```bash
# Embedding Service
curl http://localhost:8001/health

# Next.js
curl http://localhost:3000

# PostgreSQL VND
python3 demo_search.py
# Введите: vnd полномочия совета директоров
```

---

## Примеры запросов

### Чат ВНД
```bash
curl -X POST http://localhost:3000/api/vnd \
  -H "Content-Type: application/json" \
  -d '{"message":"Какие функции совета директоров?"}'
```

### Чат НПА  
```bash
curl -X POST http://localhost:3000/api/np \
  -H "Content-Type: application/json" \
  -d '{"message":"Требования к независимым директорам?"}'
```

### Анализ документа
```bash
curl -X POST http://localhost:3000/api/analyze/vnd \
  -H "Content-Type: application/json" \
  -d '{"documentContent":"Ваш документ для анализа"}'
```

---

## Если что-то не работает

1. **Порт 8001 занят?**
   ```bash
   lsof -ti:8001 | xargs kill -9
   ```

2. **Порт 3000 занят?**
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

3. **PostgreSQL недоступна?**
   - Проверить: `demo_search.py`
   - Контакт: <YOUR_DB_HOST>:5433

4. **AlemLLM не отвечает?**
   - Проверить: `node test-alemllm-simple.mjs`
   - URL: <YOUR_ALEMLLM_API_URL>

---

## Логи

- **Embedding Service**: Терминал 1
- **Next.js**: Терминал 2  
- **AlemLLM**: В логах Next.js (строки с `[AlemLLM]`)

---

## Документация

- `SUCCESS_REPORT.md` - Итоговый отчет ✅
- `ALEMLLM_SETUP.md` - Подробная настройка
- `DEBUG_ALEMLLM.md` - Отладка проблем
- `demo_search.py` - Тест векторного поиска

---

✅ Все работает! Enjoy! 🎉
