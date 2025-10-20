# Руководство по использованию векторных баз данных

## 📚 Обзор

На сервере созданы две векторные базы данных с использованием **pgvecto.rs (vectors v0.4.0)**:

1. **vnd** - Внутренние нормативные документы (ВНД)
2. **npa** - Правовые нормы Республики Казахстан (НПА)

## 🔌 Параметры подключения

```python
# База ВНД
VND_DSN = "postgresql://<YOUR_DB_USER>:<YOUR_DB_PASSWORD>@<YOUR_DB_HOST>:<YOUR_DB_PORT>/vnd"

# База НПА
NPA_DSN = "postgresql://<YOUR_DB_USER>:<YOUR_DB_PASSWORD>@<YOUR_DB_HOST>:<YOUR_DB_PORT>/npa"
```

## 🎯 Требования

### 1. Python библиотеки

```bash
pip install psycopg2-binary sentence-transformers torch numpy
```

### 2. Модель эмбеддингов

**ОБЯЗАТЕЛЬНО!** Для работы с векторными базами нужна модель эмбеддингов для преобразования текста в векторы.

**Рекомендуемая модель:** `BAAI/bge-m3`
- Размерность: 1024
- Поддержка русского языка: ✅
- Качество: высокое
- Максимальная длина: 8192 токенов

```python
from sentence_transformers import SentenceTransformer

# Загрузка модели (происходит один раз, затем кешируется)
model = SentenceTransformer("BAAI/bge-m3")
model.max_seq_length = 8192  # Для длинных текстов
```

**Альтернативные модели:**
- `intfloat/multilingual-e5-large` (размерность 1024)
- `sentence-transformers/paraphrase-multilingual-mpnet-base-v2` (размерность 768, нужно изменить в БД)

## 📊 База данных "vnd" - Внутренние документы

### Структура таблиц

```sql
-- Документы
documents (
    id UUID PRIMARY KEY,
    filename VARCHAR(512),
    title VARCHAR(512),
    lang VARCHAR(10),
    sha256 VARCHAR(64),
    page_count INTEGER,
    created_at TIMESTAMP
)

-- Секции с векторами
sections (
    id UUID PRIMARY KEY,
    document_id UUID,
    section_label VARCHAR(50),
    title TEXT,
    text TEXT,
    token_count INTEGER,
    char_count INTEGER,
    embedding vector(1024) NOT NULL,  -- ОБЯЗАТЕЛЬНО!
    created_at TIMESTAMP
)

-- Подсекции с векторами
subsections (
    id UUID PRIMARY KEY,
    document_id UUID,
    section_id UUID,
    title TEXT,
    text TEXT,
    token_count INTEGER,
    char_count INTEGER,
    embedding vector(1024) NOT NULL,  -- ОБЯЗАТЕЛЬНО!
    created_at TIMESTAMP
)
```

### Загрузка данных в ВНД

```python
import psycopg2
from sentence_transformers import SentenceTransformer
import uuid

# Подключение
conn = psycopg2.connect("postgresql://<YOUR_DB_USER>:<YOUR_DB_PASSWORD>@<YOUR_DB_HOST>:<YOUR_DB_PORT>/vnd")
cur = conn.cursor()

# Загрузка модели эмбеддингов
model = SentenceTransformer("BAAI/bge-m3")
model.max_seq_length = 8192

# 1. Вставка документа
doc_id = str(uuid.uuid4())
cur.execute("""
    INSERT INTO documents (id, filename, title, lang)
    VALUES (%s, %s, %s, %s)
""", (doc_id, "example.pdf", "Пример документа", "ru"))

# 2. Вставка секции с эмбеддингом
section_text = "Совет директоров осуществляет общее руководство деятельностью Общества..."

# ВАЖНО: Создаем эмбеддинг
embedding = model.encode([section_text], normalize_embeddings=True)[0]
embedding_list = embedding.tolist()  # Преобразуем в список

cur.execute("""
    INSERT INTO sections (id, document_id, section_label, title, text, embedding)
    VALUES (%s, %s, %s, %s, %s, %s)
""", (
    str(uuid.uuid4()),
    doc_id,
    "1.1",
    "Совет директоров",
    section_text,
    embedding_list  # Передаем как список
))

conn.commit()
cur.close()
conn.close()
```

### Поиск в ВНД

```python
import psycopg2
from sentence_transformers import SentenceTransformer

# Подключение
conn = psycopg2.connect("postgresql://<YOUR_DB_USER>:<YOUR_DB_PASSWORD>@<YOUR_DB_HOST>:<YOUR_DB_PORT>/vnd")
cur = conn.cursor()

# Загрузка модели
model = SentenceTransformer("BAAI/bge-m3")
model.max_seq_length = 8192

# Поисковый запрос
query = "какие полномочия у совета директоров?"

# ВАЖНО: Создаем эмбеддинг запроса
query_embedding = model.encode([query], normalize_embeddings=True)[0].tolist()

# Векторный поиск по секциям
cur.execute("""
    SELECT 
        s.title,
        s.text,
        d.filename,
        1 - (s.embedding <=> %s::vector) AS similarity
    FROM sections s
    JOIN documents d ON s.document_id = d.id
    ORDER BY s.embedding <=> %s::vector
    LIMIT 10
""", (query_embedding, query_embedding))

results = cur.fetchall()
for title, text, filename, similarity in results:
    print(f"Сходство: {similarity:.3f}")
    print(f"Документ: {filename}")
    print(f"Раздел: {title}")
    print(f"Текст: {text[:200]}...")
    print("-" * 80)

cur.close()
conn.close()
```

### Оператор `<=>` - косинусное расстояние

- `<=>` возвращает расстояние от 0 (идентичные) до 2 (противоположные)
- `1 - (embedding <=> query)` = косинусное сходство от -1 до 1
- Чем меньше `<=>`, тем ближе векторы

## 📊 База данных "npa" - Правовые нормы

### Структура таблиц

```sql
-- Метаданные документов
document_metadata (
    id VARCHAR(255) PRIMARY KEY,
    title TEXT NOT NULL,
    doc_type VARCHAR(100),
    doc_number VARCHAR(100),
    adoption_date DATE,
    status VARCHAR(50),
    source_url TEXT,
    created_at TIMESTAMP
)

-- Чанки с dense и sparse векторами
content_chunks (
    id SERIAL PRIMARY KEY,
    doc_id VARCHAR(255),
    metadata TEXT,
    chunk TEXT NOT NULL,
    chunk_tsv tsvector,  -- Автоматически через триггер
    embedding vector(1024) NOT NULL,  -- Dense вектор - ОБЯЗАТЕЛЬНО!
    sparse_embedding svector(250002) NOT NULL,  -- Sparse вектор - ОБЯЗАТЕЛЬНО!
    created_at TIMESTAMP
)
```

### Загрузка данных в НПА

Для НПА нужны **ДВА типа эмбеддингов:**
1. **Dense** - семантические векторы (1024)
2. **Sparse** - лексические векторы (250002)

```python
import psycopg2
from FlagEmbedding import BGEM3FlagModel
import torch

# Подключение
conn = psycopg2.connect("postgresql://<YOUR_DB_USER>:<YOUR_DB_PASSWORD>@<YOUR_DB_HOST>:<YOUR_DB_PORT>/npa")
cur = conn.cursor()

# Загрузка модели для dense и sparse векторов
device = torch.device("mps" if torch.backends.mps.is_available() else 
                     ("cuda" if torch.cuda.is_available() else "cpu"))
model = BGEM3FlagModel("BAAI/bge-m3", use_fp16=torch.cuda.is_available(), device=device)

# Функция для создания эмбеддингов
def create_embeddings(text: str):
    """Создает dense и sparse векторы"""
    output = model.encode(
        [text], 
        return_dense=True, 
        return_sparse=True, 
        return_colbert_vecs=False
    )
    
    # Dense вектор
    dense_vec = output['dense_vecs'][0].tolist()
    
    # Sparse вектор
    sparse_dict = output['lexical_weights'][0]
    sparse_indices = sorted([int(k) for k in sparse_dict.keys()])
    sparse_values = [float(sparse_dict[str(idx)]) for idx in sparse_indices]
    
    return dense_vec, sparse_indices, sparse_values

# 1. Вставка метаданных документа
doc_id = "123456"
cur.execute("""
    INSERT INTO document_metadata (id, title, doc_type)
    VALUES (%s, %s, %s)
""", (doc_id, "Налоговый кодекс РК", "Кодекс"))

# 2. Вставка чанка с обоими векторами
chunk_text = "Статья 1. Налоговое законодательство Республики Казахстан..."

# ВАЖНО: Создаем оба типа эмбеддингов
dense_vec, sparse_indices, sparse_values = create_embeddings(chunk_text)

# Форматируем sparse вектор для PostgreSQL
sparse_str = f"{{1:{{{','.join(map(str, sparse_indices))}}}:{{{','.join(map(str, sparse_values))}}}}}"

cur.execute("""
    INSERT INTO content_chunks (doc_id, metadata, chunk, embedding, sparse_embedding)
    VALUES (%s, %s, %s, %s, %s::svector)
""", (
    doc_id,
    "Статья 1",
    chunk_text,
    dense_vec,
    sparse_str
))

conn.commit()
cur.close()
conn.close()
```

### Гибридный поиск в НПА

НПА поддерживает **3 типа поиска:**
1. **BM25** - полнотекстовый поиск
2. **Dense** - семантический поиск
3. **Sparse** - лексический поиск

```python
import psycopg2
from FlagEmbedding import BGEM3FlagModel
import torch

conn = psycopg2.connect("postgresql://<YOUR_DB_USER>:<YOUR_DB_PASSWORD>@<YOUR_DB_HOST>:<YOUR_DB_PORT>/npa")
cur = conn.cursor()

# Загрузка модели
device = torch.device("mps" if torch.backends.mps.is_available() else 
                     ("cuda" if torch.cuda.is_available() else "cpu"))
model = BGEM3FlagModel("BAAI/bge-m3", use_fp16=torch.cuda.is_available(), device=device)

query = "какие налоги платит ТОО?"

# Создаем эмбеддинги запроса
output = model.encode([query], return_dense=True, return_sparse=True, return_colbert_vecs=False)
dense_vec = output['dense_vecs'][0].tolist()
sparse_dict = output['lexical_weights'][0]
sparse_indices = sorted([int(k) for k in sparse_dict.keys()])
sparse_values = [float(sparse_dict[str(idx)]) for idx in sparse_indices]

# 1. BM25 поиск (полнотекстовый)
cur.execute("""
    SELECT doc_id, chunk, 
           ts_rank_cd(chunk_tsv, plainto_tsquery('russian', %s)) AS score
    FROM content_chunks
    WHERE chunk_tsv @@ plainto_tsquery('russian', %s)
    ORDER BY score DESC
    LIMIT 10
""", (query, query))
bm25_results = cur.fetchall()

# 2. Dense векторный поиск (семантический)
cur.execute("""
    SELECT doc_id, chunk,
           1 - (embedding <=> %s::vector) AS score
    FROM content_chunks
    ORDER BY embedding <=> %s::vector
    LIMIT 10
""", (dense_vec, dense_vec))
dense_results = cur.fetchall()

# 3. Sparse векторный поиск (лексический)
sparse_str = f"{{1:{{{','.join(map(str, sparse_indices))}}}:{{{','.join(map(str, sparse_values))}}}}}"
cur.execute("""
    SELECT doc_id, chunk,
           1 - (sparse_embedding <=> %s::svector) AS score
    FROM content_chunks
    ORDER BY sparse_embedding <=> %s::svector
    LIMIT 10
""", (sparse_str, sparse_str))
sparse_results = cur.fetchall()

# 4. Гибридный поиск с RRF (Reciprocal Rank Fusion)
def hybrid_rrf(results_list, k=60):
    """Объединяет результаты разных методов поиска"""
    rrf_scores = {}
    
    for results in results_list:
        for rank, (doc_id, chunk, score) in enumerate(results):
            key = (doc_id, chunk)
            if key not in rrf_scores:
                rrf_scores[key] = 0
            rrf_scores[key] += 1 / (k + rank)
    
    return sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)

hybrid_results = hybrid_rrf([bm25_results, dense_results, sparse_results])

for (doc_id, chunk), score in hybrid_results[:10]:
    print(f"Score: {score:.3f}")
    print(f"Doc ID: {doc_id}")
    print(f"Текст: {chunk[:200]}...")
    print("-" * 80)

cur.close()
conn.close()
```

## 🔧 Готовые функции для использования

### Для ВНД (используйте existing код)

Уже есть готовая функция в `ВНД/internal_search.py`:

```python
from ВНД.internal_search import internal_doc_search

# Простой поиск
results = internal_doc_search("полномочия совета директоров")

for result in results['results']:
    print(f"Документ: {result['doc_title']}")
    print(f"Раздел: {result['title']}")
    print(f"Сходство: {result['similarity']:.3f}")
    print(f"Текст: {result['text'][:200]}...")
    print("-" * 80)
```

**ВАЖНО:** Обновите строку подключения в `internal_search.py`:

```python
# В файле ВНД/internal_search.py
class InternalSearchConfig(BaseModel):
    # ...
    DB_DSN: str = Field(default="postgresql://<YOUR_DB_USER>:<YOUR_DB_PASSWORD>@<YOUR_DB_HOST>:<YOUR_DB_PORT>/vnd")
```

### Для НПА (используйте existing код)

Уже есть готовая функция в `Правовые нормы/rag_npa.py`:

```python
from Правовые нормы.rag_npa import legal_search, legal_generate_answer

# Поиск
results = legal_search("налоги для ТОО", top_k=5)

# Вывод результатов
for r in results['results']:
    print(f"Документ: {r['title']}")
    print(f"Сходство: {r['score']:.3f}")
    print(f"Текст: {r['chunk'][:200]}...")
    print(f"Ссылка: {r['link']}")
    print("-" * 80)

# Генерация ответа с источниками
answer = legal_generate_answer(results['query'], results['results'])
print(answer)
```

**ВАЖНО:** Обновите строку подключения в `rag_npa.py`:

```python
# В файле Правовые нормы/rag_npa.py
def get_npa_conn():
    return psycopg2.connect(
        "postgresql://<YOUR_DB_USER>:<YOUR_DB_PASSWORD>@<YOUR_DB_HOST>:<YOUR_DB_PORT>/npa"
    )
```

## ⚙️ Переменные окружения (рекомендуется)

Создайте `.env` файл:

```bash
# Базы данных
VND_DB_DSN=postgresql://<YOUR_DB_USER>:<YOUR_DB_PASSWORD>@<YOUR_DB_HOST>:<YOUR_DB_PORT>/vnd
NPA_DB_DSN=postgresql://<YOUR_DB_USER>:<YOUR_DB_PASSWORD>@<YOUR_DB_HOST>:<YOUR_DB_PORT>/npa

# Модель эмбеддингов
EMBED_MODEL=BAAI/bge-m3

# OpenAI (для генерации ответов)
OPENAI_API_KEY=your_key_here
```

## 📈 Производительность и оптимизация

### Индексы HNSW

В базах используется алгоритм HNSW с параметрами:
- `m = 16` - количество связей на узел
- `ef_construction = 64` - точность построения

Для улучшения качества поиска (медленнее):
```sql
-- Пересоздать индекс с большими параметрами
DROP INDEX sections_embedding_idx;
CREATE INDEX sections_embedding_idx 
ON sections USING vectors (embedding vector_cos_ops)
WITH (options = $$
    [indexing.hnsw]
    m = 32
    ef_construction = 128
$$);
```

### Vacuum и analyze

Периодически запускайте:
```sql
VACUUM ANALYZE sections;
VACUUM ANALYZE subsections;
VACUUM ANALYZE content_chunks;
```

## 🚨 Важные замечания

### 1. Эмбеддинги ОБЯЗАТЕЛЬНЫ

❌ **Нельзя вставлять данные без эмбеддингов:**
```python
# ЭТО НЕ РАБОТАЕТ!
cur.execute("""
    INSERT INTO sections (document_id, title, text)
    VALUES (%s, %s, %s)
""", (doc_id, "Заголовок", "Текст"))
# ERROR: null value in column "embedding"
```

✅ **Всегда создавайте эмбеддинги:**
```python
# ПРАВИЛЬНО!
embedding = model.encode([text], normalize_embeddings=True)[0].tolist()
cur.execute("""
    INSERT INTO sections (document_id, title, text, embedding)
    VALUES (%s, %s, %s, %s)
""", (doc_id, "Заголовок", "Текст", embedding))
```

### 2. Размерность векторов

- ВНД: `vector(1024)` - фиксированная размерность
- НПА: `vector(1024)` для dense, `svector(250002)` для sparse

Если используете другую модель с другой размерностью, нужно изменить схему БД.

### 3. Нормализация эмбеддингов

Для косинусного сходства **рекомендуется нормализовать** векторы:

```python
embedding = model.encode([text], normalize_embeddings=True)[0]
```

### 4. Оператор `<=>` vs `<->`

- `<=>` - косинусное расстояние (рекомендуется для нормализованных векторов)
- `<->` - евклидово расстояние
- `<#>` - отрицательное скалярное произведение

В наших базах используется `<=>` (косинусное).

## 🔍 Примеры запросов

### Поиск по схожести с фильтрацией

```sql
-- Поиск в конкретном документе
SELECT title, text, 1 - (embedding <=> %s::vector) AS similarity
FROM sections
WHERE document_id = %s
  AND 1 - (embedding <=> %s::vector) > 0.5
ORDER BY similarity DESC
LIMIT 10;
```

### Группировка по документам

```sql
-- Лучшее совпадение из каждого документа
SELECT DISTINCT ON (document_id)
    document_id,
    title,
    text,
    1 - (embedding <=> %s::vector) AS similarity
FROM sections
ORDER BY document_id, similarity DESC;
```

### Статистика по векторам

```sql
-- Проверка наличия векторов
SELECT 
    COUNT(*) as total,
    COUNT(embedding) as with_embedding,
    COUNT(*) - COUNT(embedding) as without_embedding
FROM sections;
```

## 📚 Дополнительные ресурсы

- [pgvecto.rs документация](https://docs.pgvecto.rs/)
- [BAAI/bge-m3 на HuggingFace](https://huggingface.co/BAAI/bge-m3)
- [Sentence Transformers](https://www.sbert.net/)

## 🆘 Частые проблемы

### Проблема: "type vector does not exist"

**Решение:** Расширение не подключено к базе
```sql
CREATE EXTENSION IF NOT EXISTS vectors;
```

### Проблема: "operator class vector_cosine_ops does not exist"

**Решение:** Используйте правильный оператор для pgvecto.rs
```sql
-- НЕ vector_cosine_ops
-- А vector_cos_ops
CREATE INDEX ... USING vectors (embedding vector_cos_ops);
```

### Проблема: Медленный поиск

**Решения:**
1. Проверьте наличие индексов: `\di`
2. Запустите `VACUUM ANALYZE`
3. Увеличьте параметры HNSW индекса

### Проблема: "Dimensions type modifier needed"

**Решение:** Укажите размерность для sparse векторов
```sql
-- НЕ svector
-- А svector(250002)
sparse_embedding svector(250002) NOT NULL
```

## 🎓 Готовые примеры

Полные рабочие примеры см. в файлах:
- `ВНД/internal_search.py` - поиск по ВНД
- `Правовые нормы/rag_npa.py` - гибридный поиск по НПА

---

**Создано:** 5 января 2025  
**Версия pgvecto.rs:** 0.4.0  
**Рекомендуемая модель:** BAAI/bge-m3
