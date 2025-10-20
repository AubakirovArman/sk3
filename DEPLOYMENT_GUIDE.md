# 🚀 Полное руководство по развертыванию SKAI

## Содержание
1. [Требования к серверу](#требования-к-серверу)
2. [Установка зависимостей](#установка-зависимостей)
3. [Настройка PostgreSQL](#настройка-postgresql)
4. [Установка pgvecto.rs](#установка-pgvectrs)
5. [Развертывание сервиса эмбеддингов](#развертывание-сервиса-эмбеддингов)
6. [Развертывание Next.js приложения](#развертывание-nextjs-приложения)
7. [Настройка Nginx](#настройка-nginx)
8. [Настройка PM2](#настройка-pm2)
9. [Мониторинг и логи](#мониторинг-и-логи)
10. [Решение проблем](#решение-проблем)

---

## Требования к серверу

### Минимальные требования
- **OS:** Ubuntu 20.04/22.04 LTS или macOS
- **CPU:** 4 ядра (рекомендуется 8+)
- **RAM:** 16 GB (рекомендуется 32 GB для ML модели)
- **Disk:** 50 GB SSD (рекомендуется 100 GB)
- **GPU:** Опционально (CUDA для NVIDIA или MPS для Apple Silicon)

### Сетевые требования
- Доступ к AlemLLM API: `<YOUR_ALEMLLM_BASE_URL>`
- Доступ к PostgreSQL: `<YOUR_DB_HOST>:5433` (или локальный)
- Открытые порты:
  - `3000` - Next.js приложение
  - `8001` - Сервис эмбеддингов (внутренний)
  - `80/443` - Nginx (для продакшена)

---

## Установка зависимостей

### 1. Обновление системы
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# macOS
brew update && brew upgrade
```

### 2. Установка Node.js 20+
```bash
# Ubuntu/Debian - через NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# macOS
brew install node@20

# Проверка
node --version  # должно быть v20.x.x
npm --version   # должно быть v10.x.x
```

### 3. Установка Python 3.10+
```bash
# Ubuntu/Debian
sudo apt install -y python3.10 python3.10-venv python3-pip

# macOS (уже установлен)
python3 --version  # должно быть 3.10+

# Создание виртуального окружения
python3 -m venv venv
source venv/bin/activate  # Linux/macOS
# или
.\venv\Scripts\activate   # Windows
```

### 4. Установка PostgreSQL 15+
```bash
# Ubuntu/Debian
sudo apt install -y postgresql-15 postgresql-contrib-15

# macOS
brew install postgresql@15
brew services start postgresql@15

# Проверка
psql --version  # должно быть PostgreSQL 15.x
```

### 5. Установка дополнительных инструментов
```bash
# Ubuntu/Debian
sudo apt install -y git curl wget build-essential libpq-dev

# macOS
brew install git curl wget
```

---

## Настройка PostgreSQL

### 1. Создание пользователя и баз данных

```bash
# Подключение к PostgreSQL
sudo -u postgres psql

# В psql выполнить:
```

```sql
-- Создание пользователя
CREATE USER skai_user WITH PASSWORD 'your_secure_password_here';

-- Создание баз данных
CREATE DATABASE vnd WITH OWNER skai_user ENCODING 'UTF8';
CREATE DATABASE npa WITH OWNER skai_user ENCODING 'UTF8';

-- Предоставление прав
GRANT ALL PRIVILEGES ON DATABASE vnd TO skai_user;
GRANT ALL PRIVILEGES ON DATABASE npa TO skai_user;

-- Выход
\q
```

### 2. Настройка postgresql.conf

```bash
# Найти конфигурационный файл
sudo find /etc/postgresql -name postgresql.conf
# или
sudo find /usr/local/var/postgresql* -name postgresql.conf  # macOS

# Редактировать конфиг
sudo nano /etc/postgresql/15/main/postgresql.conf
```

Добавить/изменить:
```conf
# Подключения
listen_addresses = '*'
max_connections = 200

# Память
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
work_mem = 64MB

# Для векторного поиска
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
```

### 3. Настройка pg_hba.conf

```bash
sudo nano /etc/postgresql/15/main/pg_hba.conf
```

Добавить:
```conf
# Локальные подключения
local   all             all                                     peer
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256

# Удаленные подключения (если нужно)
host    all             all             0.0.0.0/0               scram-sha-256
```

### 4. Перезапуск PostgreSQL

```bash
# Ubuntu/Debian
sudo systemctl restart postgresql

# macOS
brew services restart postgresql@15
```

---

## Установка pgvecto.rs

### Вариант 1: Использование существующего сервера

Если вы используете существующую БД `<YOUR_DB_HOST>:5433`, расширение уже установлено. Проверьте:

```bash
psql -h <YOUR_DB_HOST> -p 5433 -U <your-user> -d vnd -c "SELECT * FROM pg_extension WHERE extname = 'vectors';"
```

### Вариант 2: Локальная установка

#### Ubuntu/Debian (из бинарников)

```bash
# Скачать последнюю версию
wget https://github.com/tensorchord/pgvecto.rs/releases/download/v0.4.0/vectors-pg15_0.4.0_amd64.deb

# Установить
sudo dpkg -i vectors-pg15_0.4.0_amd64.deb

# Или для PostgreSQL 16
wget https://github.com/tensorchord/pgvecto.rs/releases/download/v0.4.0/vectors-pg16_0.4.0_amd64.deb
sudo dpkg -i vectors-pg16_0.4.0_amd64.deb
```

#### macOS (компиляция из исходников)

```bash
# Установка Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Клонирование репозитория
git clone https://github.com/tensorchord/pgvecto.rs.git
cd pgvecto.rs

# Компиляция и установка
cargo install cargo-pgrx --version 0.11.3
cargo pgrx init --pg15=/usr/local/opt/postgresql@15/bin/pg_config
cargo pgrx install --release
```

### 3. Включение расширения в базах данных

```bash
# VND база
psql -U skai_user -d vnd -c "CREATE EXTENSION IF NOT EXISTS vectors;"

# NPA база
psql -U skai_user -d npa -c "CREATE EXTENSION IF NOT EXISTS vectors;"
```

### 4. Проверка установки

```sql
-- Подключиться к базе
psql -U skai_user -d vnd

-- Проверить версию
SELECT vectors.version();

-- Должно вывести: 0.4.0
```

---

## Развертывание сервиса эмбеддингов

### 1. Клонирование проекта

```bash
cd /opt  # или любая другая директория
sudo git clone https://github.com/yourusername/skai.git
cd skai
sudo chown -R $USER:$USER .
```

### 2. Установка Python зависимостей

```bash
# Активировать виртуальное окружение
python3 -m venv venv
source venv/bin/activate

# Установить зависимости
pip install --upgrade pip
pip install fastapi uvicorn torch transformers FlagEmbedding numpy
```

### 3. Скачивание модели BAAI/bge-m3

```bash
# Создать директорию для моделей
mkdir -p models

# Скачать модель (будет автоматически при первом запуске)
python3 << 'EOF'
from FlagEmbedding import BGEM3FlagModel
print("Загрузка модели BAAI/bge-m3...")
model = BGEM3FlagModel('BAAI/bge-m3', use_fp16=True, device='cpu')
print("Модель успешно загружена!")
EOF
```

### 4. Создание systemd сервиса (Ubuntu/Debian)

```bash
sudo nano /etc/systemd/system/skai-embeddings.service
```

```ini
[Unit]
Description=SKAI Embedding Service
After=network.target

[Service]
Type=simple
User=your_username
WorkingDirectory=/opt/skai
Environment="PATH=/opt/skai/venv/bin"
ExecStart=/opt/skai/venv/bin/python3 /opt/skai/embedding-service.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Перезагрузить systemd
sudo systemctl daemon-reload

# Запустить сервис
sudo systemctl start skai-embeddings

# Включить автозапуск
sudo systemctl enable skai-embeddings

# Проверить статус
sudo systemctl status skai-embeddings
```

### 5. Создание launchd сервиса (macOS)

```bash
nano ~/Library/LaunchAgents/com.skai.embeddings.plist
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.skai.embeddings</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/skai/venv/bin/python3</string>
        <string>/opt/skai/embedding-service.py</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/opt/skai</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/opt/skai/logs/embeddings.log</string>
    <key>StandardErrorPath</key>
    <string>/opt/skai/logs/embeddings-error.log</string>
</dict>
</plist>
```

```bash
# Загрузить сервис
launchctl load ~/Library/LaunchAgents/com.skai.embeddings.plist

# Проверить статус
launchctl list | grep skai
```

### 6. Проверка работы сервиса

```bash
# Проверка health endpoint
curl http://localhost:8001/health

# Ожидаемый ответ:
# {
#   "status": "healthy",
#   "model": "BAAI/bge-m3",
#   "device": "cpu",
#   "embedding_dim": 1024
# }

# Тест эмбеддинга
curl -X POST http://localhost:8001/embed \
  -H "Content-Type: application/json" \
  -d '{"texts": ["Тестовый запрос"]}'
```

---

## Развертывание Next.js приложения

### 1. Установка зависимостей проекта

```bash
cd /opt/skai
npm install
```

### 2. Настройка переменных окружения

```bash
nano .env.local
```

```env
# База данных PostgreSQL
DATABASE_URL="postgresql://skai_user:your_secure_password_here@localhost:5432/vnd"
DATABASE_URL_NPA="postgresql://skai_user:your_secure_password_here@localhost:5432/npa"

# Или используйте внешнюю БД
DATABASE_URL="postgresql://<user>:<YOUR_DB_PASSWORD>@<YOUR_DB_HOST>:5433/vnd"
DATABASE_URL_NPA="postgresql://<user>:<YOUR_DB_PASSWORD>@<YOUR_DB_HOST>:5433/npa"

# AlemLLM API
ALEMLLM_API_URL="<YOUR_ALEMLLM_API_URL>/chat/completions"
ALEMLLM_MODEL="astanahub/alemllm"

# NextAuth (сгенерировать случайную строку)
NEXTAUTH_SECRET="your_random_secret_here_min_32_chars"
NEXTAUTH_URL="http://localhost:3000"

# Сервис эмбеддингов
EMBEDDING_SERVICE_URL="http://localhost:8001"

# Node окружение
NODE_ENV="production"
```

Генерация NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### 3. Сборка приложения

```bash
# Production сборка
npm run build

# Проверка
ls -la .next
```

### 4. Запуск через PM2 (рекомендуется)

```bash
# Установка PM2 глобально
sudo npm install -g pm2

# Создание ecosystem файла
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'skai-nextjs',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/opt/skai',
    instances: 2,  // кластер из 2 процессов
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/nextjs-error.log',
    out_file: './logs/nextjs-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}
```

```bash
# Создать директорию для логов
mkdir -p logs

# Запустить через PM2
pm2 start ecosystem.config.js

# Сохранить конфигурацию
pm2 save

# Настроить автозапуск
pm2 startup
# Выполнить команду, которую PM2 выведет

# Проверить статус
pm2 status
pm2 logs skai-nextjs
```

### 5. Альтернатива: systemd сервис (Ubuntu/Debian)

```bash
sudo nano /etc/systemd/system/skai-nextjs.service
```

```ini
[Unit]
Description=SKAI Next.js Application
After=network.target skai-embeddings.service

[Service]
Type=simple
User=your_username
WorkingDirectory=/opt/skai
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl start skai-nextjs
sudo systemctl enable skai-nextjs
sudo systemctl status skai-nextjs
```

---

## Настройка Nginx

### 1. Установка Nginx

```bash
# Ubuntu/Debian
sudo apt install -y nginx

# macOS
brew install nginx
```

### 2. Конфигурация для продакшена

```bash
sudo nano /etc/nginx/sites-available/skai
```

```nginx
# HTTP -> HTTPS редирект
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS сервер
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL сертификаты (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Логи
    access_log /var/log/nginx/skai-access.log;
    error_log /var/log/nginx/skai-error.log;

    # Размеры
    client_max_body_size 50M;

    # Проксирование к Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
    }

    # Статические файлы Next.js
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Кэширование статики
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
        proxy_pass http://localhost:3000;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }
}
```

### 3. Включение конфигурации

```bash
# Создать симлинк
sudo ln -s /etc/nginx/sites-available/skai /etc/nginx/sites-enabled/

# Проверить конфигурацию
sudo nginx -t

# Перезагрузить Nginx
sudo systemctl reload nginx

# Включить автозапуск
sudo systemctl enable nginx
```

### 4. Получение SSL сертификата (Let's Encrypt)

```bash
# Установка Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Автопродление (добавляется автоматически в cron)
sudo certbot renew --dry-run
```

---

## Настройка PM2

### Мониторинг и управление

```bash
# Просмотр статуса всех процессов
pm2 status

# Детальная информация
pm2 show skai-nextjs

# Мониторинг в реальном времени
pm2 monit

# Логи
pm2 logs skai-nextjs
pm2 logs skai-nextjs --lines 100

# Перезапуск
pm2 restart skai-nextjs

# Остановка
pm2 stop skai-nextjs

# Удаление
pm2 delete skai-nextjs

# Очистка логов
pm2 flush
```

### PM2 Dashboard (опционально)

```bash
# Установка PM2 Plus (бесплатный тариф)
pm2 plus

# Следуйте инструкциям для подключения
```

---

## Мониторинг и логи

### 1. Структура логов

```bash
# Создать директории
mkdir -p /opt/skai/logs
touch /opt/skai/logs/{embeddings,nextjs-out,nextjs-error}.log

# Настроить logrotate
sudo nano /etc/logrotate.d/skai
```

```
/opt/skai/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    create 0644 your_username your_username
}
```

### 2. Проверка здоровья сервисов

Создать скрипт мониторинга:

```bash
nano /opt/skai/healthcheck.sh
chmod +x /opt/skai/healthcheck.sh
```

```bash
#!/bin/bash

echo "=== SKAI Health Check ==="
echo "Time: $(date)"
echo ""

# Проверка сервиса эмбеддингов
echo "1. Embedding Service:"
EMBED_STATUS=$(curl -s http://localhost:8001/health)
if [ $? -eq 0 ]; then
    echo "✅ Running: $EMBED_STATUS"
else
    echo "❌ Not responding"
fi
echo ""

# Проверка Next.js
echo "2. Next.js Application:"
NEXTJS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$NEXTJS_STATUS" = "200" ] || [ "$NEXTJS_STATUS" = "404" ]; then
    echo "✅ Running (HTTP $NEXTJS_STATUS)"
else
    echo "❌ Not responding (HTTP $NEXTJS_STATUS)"
fi
echo ""

# Проверка PostgreSQL
echo "3. PostgreSQL:"
if psql -U skai_user -d vnd -c "SELECT 1" > /dev/null 2>&1; then
    echo "✅ Connected"
else
    echo "❌ Cannot connect"
fi
echo ""

# Проверка PM2
echo "4. PM2 Processes:"
pm2 jlist | jq -r '.[] | "\(.name): \(.pm2_env.status)"'
echo ""

# Использование диска
echo "5. Disk Usage:"
df -h /opt/skai | tail -1
echo ""

# Использование памяти
echo "6. Memory Usage:"
free -h | grep Mem
echo ""

echo "=== Health Check Complete ==="
```

### 3. Настройка cron для мониторинга

```bash
crontab -e
```

```cron
# Проверка здоровья каждые 5 минут
*/5 * * * * /opt/skai/healthcheck.sh >> /opt/skai/logs/healthcheck.log 2>&1

# Очистка старых логов каждую неделю
0 0 * * 0 find /opt/skai/logs -name "*.log" -mtime +30 -delete
```

---

## Решение проблем

### Проблема 1: Сервис эмбеддингов не запускается

```bash
# Проверить логи
sudo journalctl -u skai-embeddings -n 50

# Проверить, что порт свободен
sudo lsof -i :8001

# Проверить наличие модели
python3 -c "from FlagEmbedding import BGEM3FlagModel; model = BGEM3FlagModel('BAAI/bge-m3', use_fp16=True)"

# Переустановить зависимости
source venv/bin/activate
pip install --force-reinstall FlagEmbedding torch
```

### Проблема 2: Next.js не подключается к PostgreSQL

```bash
# Проверить подключение
psql -h <YOUR_DB_HOST> -p 5433 -U <your-user> -d vnd

# Проверить переменные окружения
cat .env.local

# Проверить сетевое подключение
telnet <YOUR_DB_HOST> 5433
nc -zv <YOUR_DB_HOST> 5433
```

### Проблема 3: AlemLLM API возвращает 400/500

```bash
# Проверить доступность API
curl -X POST <YOUR_ALEMLLM_API_URL>/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"astanahub/alemllm","messages":[{"role":"user","content":"test"}],"max_tokens":100}'

# Проверить размер контекста в логах
pm2 logs skai-nextjs | grep "Request to AlemLLM"

# Если контекст слишком большой - оптимизировать параметры поиска
# Редактировать src/app/api/*/route.ts:
# - Уменьшить topK
# - Уменьшить limit
# - Ограничить длину текстовых фрагментов
```

### Проблема 4: Высокое потребление памяти

```bash
# Проверить использование
pm2 monit

# Ограничить память для PM2
pm2 delete skai-nextjs
pm2 start ecosystem.config.js

# В ecosystem.config.js изменить:
# max_memory_restart: '512M'

# Для сервиса эмбеддингов - использовать quantization
# В embedding-service.py:
# model = BGEM3FlagModel('BAAI/bge-m3', use_fp16=True, device='cpu', normalize_embeddings=True)
```

### Проблема 5: Медленные запросы

```bash
# Проверить индексы в PostgreSQL
psql -U skai_user -d vnd -c "\d+ sections"

# Добавить/пересоздать HNSW индексы
psql -U skai_user -d vnd << EOF
DROP INDEX IF EXISTS sections_embedding_idx;
CREATE INDEX sections_embedding_idx ON sections 
USING vectors (embedding vector_l2_ops) 
WITH (options = $$
[indexing.hnsw]
m = 16
ef = 64
$$);
EOF

# Проверить статистику запросов
psql -U skai_user -d vnd -c "SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;"
```

---

## Чеклист развертывания

### Перед запуском:

- [ ] Сервер соответствует минимальным требованиям
- [ ] Установлены Node.js 20+, Python 3.10+, PostgreSQL 15+
- [ ] PostgreSQL настроен и запущен
- [ ] Созданы базы данных vnd и npa
- [ ] Установлено расширение pgvecto.rs
- [ ] Загружена модель BAAI/bge-m3
- [ ] Сервис эмбеддингов запущен и отвечает на /health
- [ ] Next.js приложение собрано (npm run build)
- [ ] Настроены переменные окружения в .env.local
- [ ] PM2 или systemd сервисы настроены
- [ ] Nginx настроен (для продакшена)
- [ ] SSL сертификат получен (для продакшена)
- [ ] Логирование настроено
- [ ] Мониторинг настроен

### После запуска:

- [ ] Проверить /health embedding service: `curl http://localhost:8001/health`
- [ ] Проверить Next.js: `curl http://localhost:3000`
- [ ] Проверить API endpoints:
  - [ ] `curl -X POST http://localhost:3000/api/vnd -H "Content-Type: application/json" -d '{"query":"тест"}'`
  - [ ] `curl -X POST http://localhost:3000/api/np -H "Content-Type: application/json" -d '{"query":"тест"}'`
  - [ ] `curl -X POST http://localhost:3000/api/analyze/vnd -d '{"documentContent":"тест"}'`
- [ ] Проверить логи: `pm2 logs`
- [ ] Проверить использование ресурсов: `pm2 monit`
- [ ] Настроить резервное копирование баз данных
- [ ] Настроить мониторинг uptime

---

## Быстрый старт (краткая версия)

```bash
# 1. Установка зависимостей (Ubuntu)
sudo apt update && sudo apt install -y nodejs npm python3 python3-venv postgresql-15 nginx

# 2. Клонирование проекта
cd /opt
git clone <your-repo-url> skai
cd skai

# 3. Python окружение
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn torch transformers FlagEmbedding

# 4. Запуск embedding service
python3 embedding-service.py &

# 5. Node.js приложение
npm install
npm run build

# 6. Настройка .env.local
cat > .env.local << 'EOF'
DATABASE_URL="postgresql://<user>:<YOUR_DB_PASSWORD>@<YOUR_DB_HOST>:5433/vnd"
DATABASE_URL_NPA="postgresql://<user>:<YOUR_DB_PASSWORD>@<YOUR_DB_HOST>:5433/npa"
ALEMLLM_API_URL="<YOUR_ALEMLLM_API_URL>/chat/completions"
ALEMLLM_MODEL="astanahub/alemllm"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="production"
EOF

# 7. Запуск через PM2
npm install -g pm2
pm2 start npm --name skai-nextjs -- start
pm2 save
pm2 startup

# 8. Проверка
curl http://localhost:8001/health
curl http://localhost:3000
```

---

## Дополнительная информация

### Документация проекта
- [README_ALEMLLM.md](./README_ALEMLLM.md) - Полная документация проекта
- [QUICKSTART.md](./QUICKSTART.md) - Быстрый старт для разработки
- [SUCCESS_REPORT.md](./SUCCESS_REPORT.md) - Отчет о тестировании

### Поддержка
- Telegram: @your_telegram
- Email: your@email.com
- GitHub Issues: https://github.com/yourusername/skai/issues

### Лицензия
MIT License

---

**Последнее обновление:** 5 октября 2025
**Версия:** 1.0.0
