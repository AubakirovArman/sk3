# 🎯 SKAI - Система анализа документов АО «Самрук-Қазына»

[![Status](https://img.shields.io/badge/Status-Production%20Ready-success)](.)
![AlemLLM](https://img.shields.io/badge/LLM-AlemLLM-blue)
[![PostgreSQL](https://img.shields.io/badge/Vector%20DB-PostgreSQL-orange)](.)
[![Next.js](https://img.shields.io/badge/Framework-Next.js%2015-black)](https://nextjs.org)

Интеллектуальная система для анализа корпоративных документов с использованием:
- 🤖 **AlemLLM** - казахстанская языковая модель
- 🗄️ **PostgreSQL + pgvecto.rs** - векторные базы данных
- 🔍 **BAAI/bge-m3** - multilingual embeddings
- ⚡ **Next.js 15** - современный веб-фреймворк

---

## ✨ Возможности

### 📚 Чат-боты
- **ВНД Чат** - вопросы по внутренним нормативным документам
- **НПА Чат** - консультации по законодательству Казахстана

### 📄 Анализ документов
- **ВНД Анализ** - проверка соответствия внутренним документам
- **НПА Анализ** - проверка соответствия законодательству РК
- **Итоговое заключение** - решение виртуального директора

---

## 🚀 Быстрый старт

```bash
# 1. Скопировать конфигурацию
cp .env.example .env.local
nano .env.local  # Заполнить реальными значениями

# 2. Установить зависимости
npm install
pip install -r requirements.txt

# 3. Запустить Embedding Service
python3 embedding-service.py

# 4. Запустить Next.js (новый терминал)
npm run dev

# 5. Открыть браузер
open http://localhost:3000
```

**📖 Подробнее:**
- [QUICKSTART.md](QUICKSTART.md) - Руководство для разработчиков
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Развертывание на сервере
- [ENV_CONFIGURATION.md](ENV_CONFIGURATION.md) - Настройка переменных окружения
- [SECURITY.md](SECURITY.md) - 🔐 Безопасность и защита данных

---

## 🏗️ Архитектура

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
┌──────▼───────────────────────┐
│      Next.js App             │
│   (Port 3000)                │
│                              │
│  ┌─────────────────────┐    │
│  │  API Routes         │    │
│  │  • /api/vnd         │    │
│  │  • /api/np          │    │
│  │  • /api/analyze/*   │    │
│  └──────┬──────────────┘    │
└─────────┼───────────────────┘
          │
    ┌─────┼─────┬───────────────┬─────────────┐
    │     │     │               │             │
┌───▼─────▼─┐ ┌─▼──────────┐ ┌─▼────────┐ ┌─▼──────────┐
│ AlemLLM   │ │ Embedding  │ │ VND DB   │ │ NPA DB     │
│ API       │ │ Service    │ │ (PG)     │ │ (PG)       │
│           │ │ (Port 8001)│ │          │ │            │
│ alemllm.  │ │ BAAI/bge-m3│ │ Vectors  │ │ Vectors    │
│ sk-ai.kz  │ │            │ │ 1024-dim │ │ 1024-dim   │
└───────────┘ └────────────┘ └──────────┘ └────────────┘
```

---

## 📊 Технологический стек

### Frontend & Backend
- **Next.js 15** - React framework с App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS
- **Framer Motion** - Анимации

### AI & ML
- **AlemLLM** - Языковая модель (astanahub/alemllm)
- **BAAI/bge-m3** - Multilingual embeddings
- **Sentence Transformers** - Embedding generation
- **FlagEmbedding** - Гибридный поиск

### Databases
- **PostgreSQL 16** - Основная БД
- **pgvecto.rs v0.4.0** - Векторное расширение
- **HNSW** - Алгоритм nearest neighbor search

### Infrastructure
- **FastAPI** - Embedding microservice
- **Docker** - Контейнеризация (опционально)
- **Prisma** - ORM для PostgreSQL

---

## 📁 Структура проекта

```
sk/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API endpoints
│   │   │   ├── analyze/       # Анализ документов
│   │   │   │   ├── vnd/       # ВНД анализ
│   │   │   │   ├── np/        # НПА анализ
│   │   │   │   └── summary/   # Итоговое заключение
│   │   │   ├── vnd/           # ВНД чат
│   │   │   └── np/            # НПА чат
│   │   ├── vnd/               # ВНД чат UI
│   │   ├── np/                # НПА чат UI
│   │   └── virtual-director/  # Виртуальный директор UI
│   ├── lib/                   # Библиотеки
│   │   ├── alemllm.ts         # AlemLLM клиент
│   │   ├── vector-db.ts       # PostgreSQL утилиты
│   │   ├── embedding-client.ts # Embedding клиент
│   │   └── embedding-service.py # Embedding сервис
│   └── components/            # React компоненты
├── docs/                      # Документация
├── demo_search.py             # Демо векторного поиска
├── test-api.sh                # Тесты API
├── SUCCESS_REPORT.md          # ✅ Итоговый отчет
├── QUICKSTART.md              # 🚀 Быстрый старт
└── package.json
```

---

## 🔧 Конфигурация

### Переменные окружения (.env.local)

```bash
# PostgreSQL
POSTGRES_HOST=<YOUR_DB_HOST>
POSTGRES_PORT=5433
POSTGRES_USER=<your-username>
POSTGRES_PASSWORD=<YOUR_DB_PASSWORD>

# Databases
VND_DATABASE=vnd
NPA_DATABASE=npa

# Services
EMBEDDING_SERVICE_URL=http://localhost:8001
ALEMLLM_API_URL=<YOUR_ALEMLLM_API_URL>

# NextAuth (если используется)
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
```

---

## 📖 Документация

| Документ | Описание |
|----------|----------|
| [SUCCESS_REPORT.md](SUCCESS_REPORT.md) | ✅ Итоговый отчет о миграции |
| [QUICKSTART.md](QUICKSTART.md) | 🚀 Быстрый старт |
| [ALEMLLM_SETUP.md](ALEMLLM_SETUP.md) | 📚 Подробная настройка |
| [DEBUG_ALEMLLM.md](DEBUG_ALEMLLM.md) | 🔧 Отладка проблем |
| [MIGRATION_COMPLETE.md](MIGRATION_COMPLETE.md) | 📝 Полный отчет о миграции |

---

## 🧪 Тестирование

### Автоматические тесты
```bash
./test-api.sh
```

### Ручное тестирование

**ВНД Чат:**
```bash
curl -X POST http://localhost:3000/api/vnd \
  -H "Content-Type: application/json" \
  -d '{"message":"Какие функции совета директоров?"}'
```

**НПА Чат:**
```bash
curl -X POST http://localhost:3000/api/np \
  -H "Content-Type: application/json" \
  -d '{"message":"Требования к независимым директорам?"}'
```

**Векторный поиск (Python):**
```bash
python3 demo_search.py
# vnd полномочия совета директоров
# npa требования к директорам
```

---

## 📈 Производительность

| Метрика | Значение |
|---------|----------|
| Embedding generation | ~200ms |
| Vector search | ~100ms |
| AlemLLM response | 2-5 sec |
| Total request time | 3-6 sec |
| Embedding dimension | 1024 |
| Max context length | ~8000 chars |

---

## 🛡️ Безопасность

- ✅ Type-safe TypeScript
- ✅ Input validation
- ✅ Error handling
- ✅ SQL injection protection (pg library)
- ⚠️ TODO: Rate limiting
- ⚠️ TODO: API authentication
- ⚠️ TODO: Environment variables encryption

---

## 🤝 Вклад

Проект разработан для АО «Самрук-Қазына»

### Технологии
- **AlemLLM** by SK AI
- **PostgreSQL** by PostgreSQL Global Development Group
- **Next.js** by Vercel
- **BAAI/bge-m3** by Beijing Academy of Artificial Intelligence

---

## 📄 Лицензия

Proprietary - АО «Самрук-Қазына»

---

## 📞 Поддержка

- **Embedding Service:** http://localhost:8001/health
- **API Docs:** См. [ALEMLLM_SETUP.md](ALEMLLM_SETUP.md)
- **Векторные БД:** <YOUR_DB_HOST>:5433

---

## ⭐ Статус

```
✅ OpenAI полностью удален
✅ AlemLLM интегрирован
✅ PostgreSQL векторные базы подключены
✅ Все 5 API endpoints работают
✅ Embedding service функционирует
✅ Векторный поиск работает
✅ Production ready
```

---

<div align="center">

**Сделано с ❤️ для АО «Самрук-Қазына»**

[Документация](docs/) • [API](ALEMLLM_SETUP.md) • [Тесты](test-api.sh)

</div>
