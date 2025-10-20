# ⚡ Шпаргалка SKAI

## 🚀 Быстрый старт

```bash
# 1. Конфигурация
cp .env.example .env.local && nano .env.local

# 2. Проверка
node test-env-config.mjs

# 3. Запуск embedding service (терминал 1)
python3 embedding-service.py

# 4. Запуск Next.js (терминал 2)
npm run dev

# 5. Браузер
open http://localhost:3000
```

## 📋 Переменные окружения (.env.local)

```bash
# AlemLLM
ALEMLLM_API_URL="<YOUR_ALEMLLM_API_URL>"
ALEMLLM_MODEL="astanahub/alemllm"

# VND Database
VND_DB_HOST="<YOUR_DB_HOST>"
VND_DB_PORT="5433"
VND_DB_NAME="vnd"
VND_DB_USER="<your-username>"
VND_DB_PASSWORD="<пароль>"

# NPA Database
NPA_DB_HOST="<YOUR_DB_HOST>"
NPA_DB_PORT="5433"
NPA_DB_NAME="npa"
NPA_DB_USER="<your-username>"
NPA_DB_PASSWORD="<пароль>"

# Services
EMBEDDING_SERVICE_URL="http://localhost:8001"
NEXTAUTH_SECRET="<32+ символов>"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

## 🧪 Проверка

```bash
# Конфигурация
node test-env-config.mjs

# Embedding service
curl http://localhost:8001/health

# Next.js
curl http://localhost:3000

# VND БД
psql -h <YOUR_DB_HOST> -p 5433 -U <your-user> -d vnd -c "SELECT 1"

# NPA БД
psql -h <YOUR_DB_HOST> -p 5433 -U <your-user> -d npa -c "SELECT 1"
```

## 📚 API Endpoints

```bash
# ВНД Чат
curl -X POST http://localhost:3000/api/vnd \
  -H "Content-Type: application/json" \
  -d '{"query":"Ваш вопрос"}'

# НПА Чат
curl -X POST http://localhost:3000/api/np \
  -H "Content-Type: application/json" \
  -d '{"query":"Ваш вопрос"}'

# ВНД Анализ
curl -X POST http://localhost:3000/api/analyze/vnd \
  -H "Content-Type: application/json" \
  -d '{"documentContent":"Текст документа"}'

# НПА Анализ
curl -X POST http://localhost:3000/api/analyze/np \
  -H "Content-Type: application/json" \
  -d '{"documentContent":"Текст документа"}'

# Итоговое заключение
curl -X POST http://localhost:3000/api/analyze/summary \
  -H "Content-Type: application/json" \
  -d '{"vndResult":"...","npResult":"..."}'
```

## 🔧 Production запуск

```bash
# Build
npm run build

# PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Systemd (embedding service)
sudo systemctl start skai-embeddings
sudo systemctl enable skai-embeddings

# Systemd (Next.js)
sudo systemctl start skai-nextjs
sudo systemctl enable skai-nextjs

# Nginx
sudo systemctl restart nginx
```

## 📖 Документация

| Что нужно | Файл |
|-----------|------|
| Настройка env | `ENV_CONFIGURATION.md` |
| Безопасность | `SECURITY.md` |
| Развертывание | `DEPLOYMENT_GUIDE.md` |
| Быстрый старт | `QUICKSTART.md` |
| Архитектура | `README_ALEMLLM.md` |

## 🔒 Безопасность

```bash
# Права на .env.local
chmod 600 .env.local

# Проверка Git
git status  # .env.local НЕ должен быть в списке

# Генерация NEXTAUTH_SECRET
openssl rand -base64 32
```

## 🎯 Embedding Service

```bash
# Запуск
python3 src/lib/embedding-service.py

# Запуск в фоне
nohup python3 src/lib/embedding-service.py > embedding-service.log 2>&1 &

# Проверка
curl http://localhost:8001/health

# Найти процесс
lsof -i :8001 -P -n

# Остановить
kill $(lsof -ti :8001)

# Просмотр логов
tail -f embedding-service.log
```

## 🐛 Troubleshooting

```bash
# Проверка портов
lsof -i :3000  # Next.js
lsof -i :8001  # Embedding service

# Остановить зависший процесс
kill $(lsof -ti :8001)  # Embedding service
kill $(lsof -ti :3000)  # Next.js

# Логи PM2
pm2 logs
pm2 monit

# Логи systemd
journalctl -u skai-embeddings -f
journalctl -u skai-nextjs -f

# Логи Nginx
tail -f /var/log/nginx/skai-error.log
```

## 📊 Статус системы

```bash
# PM2
pm2 status

# Systemd
systemctl status skai-embeddings
systemctl status skai-nextjs
systemctl status nginx

# PostgreSQL
pg_isready -h <YOUR_DB_HOST> -p 5433
```

## 🔄 Обновление

```bash
# Pull изменений
git pull origin main

# Обновить зависимости
npm install
pip install -r requirements.txt

# Rebuild
npm run build

# Перезапуск
pm2 restart all
# или
sudo systemctl restart skai-embeddings
sudo systemctl restart skai-nextjs
```

---

**Версия:** 2.0.0 | **Дата:** 5 октября 2025
