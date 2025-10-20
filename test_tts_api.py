#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Тестовый скрипт для проверки TTS API
URL: https://tts.sk-ai.kz/api/tts
"""

import requests
import json
from datetime import datetime

# Конфигурация
TTS_API_URL = "https://tts.sk-ai.kz/api/tts"

def test_tts(text: str, lang: str = "kk"):
    """
    Тест TTS API
    
    Args:
        text: Текст для озвучки
        lang: Язык (kk - казахский, ru - русский)
    """
    print(f"\n{'='*60}")
    print(f"🎤 TTS API Test")
    print(f"{'='*60}")
    print(f"📝 Text: {text}")
    print(f"🌐 Language: {lang}")
    print(f"🔗 URL: {TTS_API_URL}")
    print(f"{'='*60}\n")
    
    # Подготовка запроса
    payload = {
        "text": text,
        "lang": lang
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        print("📤 Отправка запроса...")
        response = requests.post(
            TTS_API_URL,
            json=payload,
            headers=headers,
            timeout=30
        )
        
        print(f"📥 Статус ответа: {response.status_code}")
        print(f"📊 Заголовки ответа:")
        for key, value in response.headers.items():
            print(f"   {key}: {value}")
        
        print(f"\n📦 Content-Type: {response.headers.get('Content-Type', 'Unknown')}")
        print(f"📏 Content-Length: {response.headers.get('Content-Length', 'Unknown')} bytes")
        
        if response.status_code == 200:
            print("\n✅ Успешно!")
            
            # Проверяем тип контента
            content_type = response.headers.get('Content-Type', '')
            
            if 'audio' in content_type or 'octet-stream' in content_type:
                # Это аудио файл
                print(f"🎵 Получен аудио файл")
                
                # Сохраняем файл
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"tts_test_{lang}_{timestamp}.wav"
                
                with open(filename, 'wb') as f:
                    f.write(response.content)
                
                print(f"💾 Сохранено в: {filename}")
                print(f"📏 Размер файла: {len(response.content)} bytes")
                
            elif 'json' in content_type:
                # Это JSON ответ
                print(f"📄 Получен JSON ответ")
                data = response.json()
                print(f"📋 Данные:")
                print(json.dumps(data, indent=2, ensure_ascii=False))
                
            else:
                # Неизвестный формат
                print(f"❓ Неизвестный тип контента")
                print(f"📄 Первые 500 символов ответа:")
                print(response.text[:500])
        else:
            print(f"\n❌ Ошибка!")
            print(f"📄 Ответ сервера:")
            try:
                error_data = response.json()
                print(json.dumps(error_data, indent=2, ensure_ascii=False))
            except:
                print(response.text)
                
    except requests.exceptions.Timeout:
        print("❌ Ошибка: Превышено время ожидания (timeout)")
    except requests.exceptions.RequestException as e:
        print(f"❌ Ошибка запроса: {e}")
    except Exception as e:
        print(f"❌ Неожиданная ошибка: {e}")


if __name__ == "__main__":
    print("\n🧪 Тестирование TTS API\n")
    
    # Тест 1: Казахский язык
    test_tts("Сәлем, қалайсың?", "kk")
    
    print("\n" + "="*60 + "\n")
    
    # Тест 2: Русский язык
    test_tts("Привет, как дела?", "ru")
    
    print("\n" + "="*60)
    print("✅ Тестирование завершено!")
    print("="*60 + "\n")
