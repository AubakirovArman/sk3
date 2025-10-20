#!/bin/bash

# Скрипт для деплоя обновления с поддержкой video storage
set -e

echo "🚀 Начало деплоя обновления для app3.sk-ai.kz"
echo "================================================"

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Проверка что мы в правильной директории
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Ошибка: docker-compose.yml не найден. Запустите скрипт из корня проекта.${NC}"
    exit 1
fi

# 1. Получить последние изменения
echo -e "\n${YELLOW}📥 Шаг 1: Получение последних изменений из Git...${NC}"
git pull origin main || {
    echo -e "${RED}❌ Не удалось получить изменения из Git${NC}"
    exit 1
}

# 2. Остановить контейнеры
echo -e "\n${YELLOW}🛑 Шаг 2: Остановка текущих контейнеров...${NC}"
docker-compose down

# 3. Создать backup текущих видео (если volume существует)
echo -e "\n${YELLOW}💾 Шаг 3: Создание резервной копии видео...${NC}"
if docker volume inspect sk_videos_data &> /dev/null; then
    BACKUP_FILE="videos-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    docker run --rm \
        -v sk_videos_data:/data \
        -v $(pwd):/backup \
        alpine tar czf /backup/$BACKUP_FILE /data 2>/dev/null || true
    echo -e "${GREEN}✅ Backup создан: $BACKUP_FILE${NC}"
else
    echo -e "${YELLOW}⚠️  Volume sk_videos_data не существует, backup пропущен${NC}"
fi

# 4. Пересобрать образ
echo -e "\n${YELLOW}🔨 Шаг 4: Пересборка Docker образа...${NC}"
docker-compose build --no-cache app || {
    echo -e "${RED}❌ Ошибка при сборке образа${NC}"
    exit 1
}

# 5. Запустить контейнеры
echo -e "\n${YELLOW}🚀 Шаг 5: Запуск обновленных контейнеров...${NC}"
docker-compose up -d

# 6. Дождаться готовности
echo -e "\n${YELLOW}⏳ Шаг 6: Ожидание готовности приложения...${NC}"
sleep 10

# 7. Проверить статус
echo -e "\n${YELLOW}🔍 Шаг 7: Проверка статуса...${NC}"
docker-compose ps

# 8. Проверить логи
echo -e "\n${YELLOW}📋 Последние логи приложения:${NC}"
docker-compose logs --tail=20 app

# 9. Проверить volume
echo -e "\n${YELLOW}📦 Проверка video volume:${NC}"
if docker volume inspect sk_videos_data &> /dev/null; then
    echo -e "${GREEN}✅ Volume sk_videos_data существует${NC}"
    docker exec sk_app ls -la /app/public/videos 2>/dev/null || echo "Директория создастся при первой загрузке"
else
    echo -e "${RED}❌ Volume sk_videos_data не найден!${NC}"
fi

echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}✅ Деплой завершен успешно!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "📍 Проверьте приложение: https://app3.sk-ai.kz"
echo "📍 Админ панель FAQ: https://app3.sk-ai.kz/admin/dialog-faq"
echo ""
echo "Полезные команды:"
echo "  - Просмотр логов:     docker-compose logs -f app"
echo "  - Перезапуск:         docker-compose restart app"
echo "  - Статус:             docker-compose ps"
echo "  - Список volumes:     docker volume ls | grep sk"
echo ""
