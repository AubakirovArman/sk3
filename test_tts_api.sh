#!/bin/bash
# Быстрый тест TTS API через curl

echo "🧪 Тестирование TTS API"
echo "======================"
echo ""

# Тест 1: Казахский язык
echo "📝 Тест 1: Казахский язык"
echo "Текст: Сәлем, қалайсың?"
echo ""

curl -X POST "https://tts.sk-ai.kz/api/tts" \
  -H "Content-Type: application/json" \
  -d '{"text":"Сәлем, қалайсың?","lang":"kk"}' \
  -o tts_test_kk.wav \
  -w "\nHTTP Status: %{http_code}\nContent-Type: %{content_type}\nSize: %{size_download} bytes\nTime: %{time_total}s\n" \
  -v

echo ""
echo "======================"
echo ""

# Тест 2: Русский язык
echo "📝 Тест 2: Русский язык"
echo "Текст: Привет, как дела?"
echo ""

curl -X POST "https://tts.sk-ai.kz/api/tts" \
  -H "Content-Type: application/json" \
  -d '{"text":"Привет, как дела?","lang":"ru"}' \
  -o tts_test_ru.wav \
  -w "\nHTTP Status: %{http_code}\nContent-Type: %{content_type}\nSize: %{size_download} bytes\nTime: %{time_total}s\n" \
  -v

echo ""
echo "======================"
echo "✅ Тестирование завершено!"
echo ""
echo "Сохраненные файлы:"
ls -lh tts_test_*.wav 2>/dev/null || echo "Нет сохраненных файлов"
