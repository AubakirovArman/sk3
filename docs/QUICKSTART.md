# Быстрый старт - Векторные базы данных

## 📦 Установка зависимостей

```bash
pip install psycopg2-binary sentence-transformers torch numpy FlagEmbedding
```

## 🔑 Подключение

```python
# ВНД
VND_DSN = "postgresql://<YOUR_DB_USER>:<YOUR_DB_PASSWORD>@<YOUR_DB_HOST>:<YOUR_DB_PORT>/vnd"

# НПА
NPA_DSN = "postgresql://<YOUR_DB_USER>:<YOUR_DB_PASSWORD>@<YOUR_DB_HOST>:<YOUR_DB_PORT>/npa"
```

## ⚡ Использование (самое простое)

### ВНД - Внутренние документы

```python
from ВНД.internal_search import internal_doc_search

# Поиск (возвращает готовые результаты)
results = internal_doc_search("полномочия совета директоров", top_k=8)

# Вывод
for r in results['results']:
    print(f"{r['similarity']:.2f} | {r['title']}")
```

### НПА - Правовые нормы

```python
from Правовые_нормы.rag_npa import legal_search, legal_generate_answer

# Поиск
results = legal_search("налоги для ТОО", top_k=5)

# Генерация ответа с источниками
answer = legal_generate_answer(results['query'], results['results'])
print(answer)
```

## 🔧 Обновите подключения в коде

### 1. Файл `ВНД/internal_search.py`

```python
# Строка ~18
DB_DSN: str = Field(default="postgresql://<YOUR_DB_USER>:<YOUR_DB_PASSWORD>@<YOUR_DB_HOST>:<YOUR_DB_PORT>/vnd")
```

### 2. Файл `Правовые нормы/rag_npa.py`

```python
# Функция get_npa_conn (около строки 23)
def get_npa_conn():
    return psycopg2.connect(
        "postgresql://<YOUR_DB_USER>:<YOUR_DB_PASSWORD>@<YOUR_DB_HOST>:<YOUR_DB_PORT>/npa"
    )
```

## ✅ Готово!

Теперь можно использовать существующие функции `internal_doc_search()` и `legal_search()`.

## ⚠️ ВАЖНО: Нужны ли эмбеддинги?

**ДА!** Для загрузки данных нужна модель эмбеддингов:

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("BAAI/bge-m3")
model.max_seq_length = 8192
```

**НО** для использования готовых функций `internal_doc_search()` и `legal_search()` эмбеддинги создаются автоматически внутри!

## 📖 Подробнее

См. `README_VECTOR_DB_USAGE.md` для полной документации.
