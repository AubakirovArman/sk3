# Инструкция по обновлению существующего кода

## 🎯 Цель

Обновить ваши существующие файлы `internal_search.py` и `rag_npa.py` для работы с новыми векторными базами данных на удаленном сервере.

## ⚡ Быстрое обновление (2 минуты)

### 1. Обновите `ВНД/internal_search.py`

**Найдите строку ~18:**
```python
DB_DSN: str = Field(default=os.getenv("PG_DSN", "postgresql://<user>:postgres@localhost:5432/vnd"))
```

**Замените на:**
```python
DB_DSN: str = Field(default=os.getenv("PG_DSN", "postgresql://<user>:<YOUR_DB_PASSWORD>@<YOUR_DB_HOST>:5433/vnd"))
```

### 2. Обновите `Правовые нормы/rag_npa.py`

**Найдите функцию `get_npa_conn` (~строка 23):**
```python
def get_npa_conn():
    dsn = os.getenv("NPA_DB_DSN") or os.getenv("DATABASE_URL")
    if not dsn:
        raise RuntimeError("Не задан DSN: NPA_DB_DSN или DATABASE_URL")
    # Поддержка как DSN-строки, так и keyword-аргументов через переменные окружения
    if dsn.startswith("postgresql://"):
        return psycopg2.connect(dsn)
    return psycopg2.connect(**{
        "dbname": os.getenv("NPA_DB_NAME", "npa"),
        "user": os.getenv("NPA_DB_USER", "postgres"),
        "password": os.getenv("NPA_DB_PASSWORD", "postgres"),
        "host": os.getenv("NPA_DB_HOST", "localhost"),
        "port": int(os.getenv("NPA_DB_PORT", "5432")),
    })
```

**Замените на:**
```python
def get_npa_conn():
    dsn = os.getenv("NPA_DB_DSN") or os.getenv("DATABASE_URL")
    if not dsn:
        # Используем удаленную БД по умолчанию
        dsn = "postgresql://<user>:<YOUR_DB_PASSWORD>@<YOUR_DB_HOST>:5433/npa"
    
    if dsn.startswith("postgresql://"):
        return psycopg2.connect(dsn)
    
    return psycopg2.connect(**{
        "dbname": os.getenv("NPA_DB_NAME", "npa"),
        "user": os.getenv("NPA_DB_USER", "postgres"),
        "password": os.getenv("NPA_DB_PASSWORD", "<YOUR_DB_PASSWORD>"),
        "host": os.getenv("NPA_DB_HOST", "<YOUR_DB_HOST>"),
        "port": int(os.getenv("NPA_DB_PORT", "5433")),
    })
```

### 3. Готово! ✅

Теперь ваш код будет работать с удаленными векторными базами.

## 🔐 Рекомендуемый способ (через .env)

Создайте файл `.env` в корне проекта:

```bash
# .env файл
PG_DSN=postgresql://<user>:<YOUR_DB_PASSWORD>@<YOUR_DB_HOST>:5433/vnd
NPA_DB_DSN=postgresql://<user>:<YOUR_DB_PASSWORD>@<YOUR_DB_HOST>:5433/npa
EMBED_MODEL=BAAI/bge-m3
OPENAI_API_KEY=your_key_here
```

Затем в коде используйте:
```python
from dotenv import load_dotenv
load_dotenv()
```

**Ничего менять в коде не нужно!** Переменные окружения будут загружены автоматически.

## ✅ Проверка работы

### Тест 1: Проверка подключения к ВНД

```python
import psycopg2

try:
    conn = psycopg2.connect(
        "postgresql://<user>:<YOUR_DB_PASSWORD>@<YOUR_DB_HOST>:5433/vnd"
    )
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM documents")
    count = cur.fetchone()[0]
    print(f"✓ Подключение к vnd успешно! Документов: {count}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"✗ Ошибка подключения к vnd: {e}")
```

### Тест 2: Проверка подключения к НПА

```python
import psycopg2

try:
    conn = psycopg2.connect(
        "postgresql://<user>:<YOUR_DB_PASSWORD>@<YOUR_DB_HOST>:5433/npa"
    )
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM document_metadata")
    count = cur.fetchone()[0]
    print(f"✓ Подключение к npa успешно! Документов: {count}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"✗ Ошибка подключения к npa: {e}")
```

### Тест 3: Проверка функции поиска ВНД

```python
from ВНД.internal_search import internal_doc_search

try:
    results = internal_doc_search("тест", top_k=1, limit=1)
    print(f"✓ Функция internal_doc_search работает!")
    print(f"  Найдено результатов: {len(results['results'])}")
except Exception as e:
    print(f"✗ Ошибка в internal_doc_search: {e}")
```

### Тест 4: Проверка функции поиска НПА

```python
from Правовые_нормы.rag_npa import legal_search

try:
    results = legal_search("тест", top_k=1)
    print(f"✓ Функция legal_search работает!")
    print(f"  Найдено результатов: {len(results['results'])}")
except Exception as e:
    print(f"✗ Ошибка в legal_search: {e}")
```

## 🔍 Полные примеры изменений

### internal_search.py (ДО и ПОСЛЕ)

**ДО:**
```python
class InternalSearchConfig(BaseModel):
    TOP_K: int = Field(8, description="Candidates per level")
    LIMIT: int = Field(12, description="Final results limit")
    MIN_SCORE: float = Field(0.3, description="Min cosine similarity [0..1]")
    CHAR_BUDGET: int = Field(4000, description="Max context characters")
    EMBED_MODEL: str = Field(default=os.getenv("EMBED_MODEL", "BAAI/bge-m3"))
    DB_DSN: str = Field(default=os.getenv("PG_DSN", "postgresql://<user>:postgres@localhost:5432/vnd"))
```

**ПОСЛЕ:**
```python
class InternalSearchConfig(BaseModel):
    TOP_K: int = Field(8, description="Candidates per level")
    LIMIT: int = Field(12, description="Final results limit")
    MIN_SCORE: float = Field(0.3, description="Min cosine similarity [0..1]")
    CHAR_BUDGET: int = Field(4000, description="Max context characters")
    EMBED_MODEL: str = Field(default=os.getenv("EMBED_MODEL", "BAAI/bge-m3"))
    DB_DSN: str = Field(default=os.getenv("PG_DSN", "postgresql://<user>:<YOUR_DB_PASSWORD>@<YOUR_DB_HOST>:5433/vnd"))
```

### rag_npa.py (ДО и ПОСЛЕ)

**ДО:**
```python
def get_npa_conn():
    dsn = os.getenv("NPA_DB_DSN") or os.getenv("DATABASE_URL")
    if not dsn:
        raise RuntimeError("Не задан DSN: NPA_DB_DSN или DATABASE_URL")
    if dsn.startswith("postgresql://"):
        return psycopg2.connect(dsn)
    return psycopg2.connect(**{
        "dbname": os.getenv("NPA_DB_NAME", "npa"),
        "user": os.getenv("NPA_DB_USER", "postgres"),
        "password": os.getenv("NPA_DB_PASSWORD", "postgres"),
        "host": os.getenv("NPA_DB_HOST", "localhost"),
        "port": int(os.getenv("NPA_DB_PORT", "5432")),
    })
```

**ПОСЛЕ:**
```python
def get_npa_conn():
    dsn = os.getenv("NPA_DB_DSN") or os.getenv("DATABASE_URL")
    if not dsn:
        dsn = "postgresql://<user>:<YOUR_DB_PASSWORD>@<YOUR_DB_HOST>:5433/npa"
    
    if dsn.startswith("postgresql://"):
        return psycopg2.connect(dsn)
    
    return psycopg2.connect(**{
        "dbname": os.getenv("NPA_DB_NAME", "npa"),
        "user": os.getenv("NPA_DB_USER", "postgres"),
        "password": os.getenv("NPA_DB_PASSWORD", "<YOUR_DB_PASSWORD>"),
        "host": os.getenv("NPA_DB_HOST", "<YOUR_DB_HOST>"),
        "port": int(os.getenv("NPA_DB_PORT", "5433")),
    })
```

## ⚠️ Важные замечания

### 1. Совместимость векторов

Базы данных используют **pgvecto.rs (vectors)** вместо **pgvector**.

**Что это значит:**
- ✅ Ваш код остается прежним (совместимость на уровне SQL)
- ✅ Тип данных `vector` работает так же
- ✅ Оператор `<=>` работает так же
- ⚠️ Индексы создаются с синтаксисом pgvecto.rs (уже создано)

**Ничего менять не нужно!** Все совместимо.

### 2. Размерность векторов

Базы настроены на **1024 измерения** (модель BAAI/bge-m3).

Если ваш код использует другую модель:
```python
# Ваш код должен использовать
model = SentenceTransformer("BAAI/bge-m3")
model.max_seq_length = 8192

# НЕ используйте модели с другой размерностью!
# Иначе будет ошибка dimensional mismatch
```

### 3. Sparse векторы (только для НПА)

База НПА поддерживает sparse векторы, но требует:
```python
from FlagEmbedding import BGEM3FlagModel

# Вместо SentenceTransformer
model = BGEM3FlagModel("BAAI/bge-m3")
```

Ваш существующий код в `rag_npa.py` уже использует это! ✅

## 🐛 Решение проблем

### Проблема: "Connection refused"

**Причина:** Сервер недоступен или порт закрыт

**Решение:**
```bash
# Проверьте доступность
telnet <YOUR_DB_HOST> 5433

# Или через psql
psql -h <YOUR_DB_HOST> -p 5433 -U <user> -d vnd
```

### Проблема: "relation does not exist"

**Причина:** Таблицы не созданы или база пустая

**Решение:**
```bash
# Проверьте наличие таблиц
python -c "
import psycopg2
conn = psycopg2.connect('postgresql://<user>:<YOUR_DB_PASSWORD>@<YOUR_DB_HOST>:5433/vnd')
cur = conn.cursor()
cur.execute('SELECT tablename FROM pg_tables WHERE schemaname = \\'public\\'')
print(cur.fetchall())
"
```

### Проблема: "No data found"

**Причина:** Данные еще не загружены

**Решение:**
```bash
# Загрузите данные
python load_vnd_data.py
```

## ✨ Готово!

После обновления ваш код будет использовать новые векторные базы данных на удаленном сервере с pgvecto.rs.

**Следующий шаг:** Запустите тесты выше для проверки работы.

---

**Вопросы?** Смотрите [README_VECTOR_DB_USAGE.md - Частые проблемы](./README_VECTOR_DB_USAGE.md#-частые-проблемы)
