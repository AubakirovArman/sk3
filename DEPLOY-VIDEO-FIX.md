# Исправление проблемы с загрузкой видео в Docker

## Проблема
Видео файлы, загруженные через админ панель, не сохраняются после перезапуска контейнера, так как находятся внутри контейнера в `/app/public/videos/`.

## Решение
Добавлен Docker volume `videos_data` для постоянного хранения загруженных видео.

## Инструкции по деплою на сервере

### 1. Остановить текущий контейнер
```bash
cd /path/to/project
docker-compose down
```

### 2. Пересобрать образ с новыми изменениями
```bash
# Убедитесь что у вас последняя версия кода
git pull

# Пересборка образа
docker-compose build --no-cache app
```

### 3. Запустить контейнер с новым volume
```bash
docker-compose up -d
```

### 4. Проверить что volume создан
```bash
docker volume ls | grep videos_data
```

### 5. Проверить права доступа в контейнере
```bash
docker exec -it sk_app ls -la /app/public/videos
```

Должно показать:
```
drwxr-xr-x 2 nextjs nodejs 4096 ... .
```

### 6. Повторно загрузить видео через админ панель
Теперь видео будут сохраняться в Docker volume и переживут перезапуск контейнера.

## Альтернативное решение (для production)

Для больших файлов рекомендуется использовать внешнее хранилище:
- S3-совместимое хранилище (MinIO, AWS S3)
- CDN для раздачи видео
- Отдельный сервер для статики

### Использование MinIO (пример)

1. Добавить MinIO в docker-compose.yml:
```yaml
  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: admin
      MINIO_ROOT_PASSWORD: adminpassword
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
```

2. Обновить API загрузки для работы с MinIO
3. Видео будут доступны по URL: `https://minio.sk-ai.kz/videos/...`

## Проверка работы

1. Зайдите в админ панель FAQ: `https://app3.sk-ai.kz/admin/dialog-faq`
2. Создайте новый FAQ
3. Загрузите видео
4. Проверьте что URL видео: `/videos/timestamp-filename.mov`
5. Перезапустите контейнер: `docker-compose restart app`
6. Убедитесь что видео всё ещё доступно

## Текущее состояние volumes

```bash
# Посмотреть все volumes проекта
docker volume ls | grep sk

# Инспектировать videos volume
docker volume inspect sk_videos_data

# Резервная копия videos
docker run --rm -v sk_videos_data:/data -v $(pwd):/backup alpine tar czf /backup/videos-backup.tar.gz /data

# Восстановление из копии
docker run --rm -v sk_videos_data:/data -v $(pwd):/backup alpine tar xzf /backup/videos-backup.tar.gz -C /
```

## Очистка старых данных (ОСТОРОЖНО!)

```bash
# Удалить volume с видео (все файлы будут потеряны!)
docker-compose down -v
docker volume rm sk_videos_data
```
