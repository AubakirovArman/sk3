#!/usr/bin/env node

/**
 * TTS Audio Generator Script
 * 
 * Использование:
 *   node scripts/generate-tts.js <input-file> <language> [output-file]
 * 
 * Параметры:
 *   input-file  - путь к текстовому файлу с текстом для озвучки
 *   language    - язык озвучки (ru, kk, en)
 *   output-file - (опционально) имя выходного файла (по умолчанию: output.mp3)
 * 
 * Примеры:
 *   node scripts/generate-tts.js text.txt kk
 *   node scripts/generate-tts.js my-text.txt ru my-audio.mp3
 *   node scripts/generate-tts.js document.txt en speech.mp3
 */

const fs = require('fs')
const path = require('path')

// TTS API URL
const TTS_API_URL = 'https://tts.sk-ai.kz/api/tts'

// Поддерживаемые языки
const SUPPORTED_LANGUAGES = ['ru', 'kk', 'en']

// Цветной вывод в консоль
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function showUsage() {
  log('\n📢 TTS Audio Generator', 'cyan')
  log('='.repeat(50), 'cyan')
  log('\nИспользование:', 'bright')
  log('  node scripts/generate-tts.js <input-file> <language> [output-file]\n')
  log('Параметры:', 'bright')
  log('  input-file  - путь к текстовому файлу с текстом для озвучки')
  log('  language    - язык озвучки (ru, kk, en)')
  log('  output-file - (опционально) имя выходного файла (по умолчанию: output.mp3)\n')
  log('Примеры:', 'bright')
  log('  node scripts/generate-tts.js text.txt kk', 'yellow')
  log('  node scripts/generate-tts.js my-text.txt ru my-audio.mp3', 'yellow')
  log('  node scripts/generate-tts.js document.txt en speech.mp3', 'yellow')
  log('\n' + '=' .repeat(50) + '\n', 'cyan')
}

async function generateTTS(text, language) {
  try {
    log(`\n🎤 Отправка запроса к TTS API...`, 'blue')
    log(`   Язык: ${language}`, 'blue')
    log(`   Длина текста: ${text.length} символов`, 'blue')

    const response = await fetch(TTS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        lang: language,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    log(`✅ Ответ получен от API`, 'green')

    // Получаем аудио как ArrayBuffer
    const audioBuffer = await response.arrayBuffer()
    
    if (!audioBuffer || audioBuffer.byteLength === 0) {
      throw new Error('API вернул пустой аудио файл')
    }

    log(`✅ Аудио получено (${(audioBuffer.byteLength / 1024).toFixed(2)} KB)`, 'green')

    return Buffer.from(audioBuffer)
  } catch (error) {
    throw new Error(`Ошибка при генерации TTS: ${error.message}`)
  }
}

async function main() {
  const args = process.argv.slice(2)

  // Проверка аргументов
  if (args.length < 2) {
    log('\n❌ Ошибка: недостаточно аргументов\n', 'red')
    showUsage()
    process.exit(1)
  }

  const inputFile = args[0]
  const language = args[1]
  const outputFile = args[2] || 'output.mp3'

  // Проверка языка
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    log(`\n❌ Ошибка: неподдерживаемый язык "${language}"`, 'red')
    log(`   Поддерживаемые языки: ${SUPPORTED_LANGUAGES.join(', ')}\n`, 'yellow')
    process.exit(1)
  }

  // Проверка входного файла
  if (!fs.existsSync(inputFile)) {
    log(`\n❌ Ошибка: файл "${inputFile}" не найден\n`, 'red')
    process.exit(1)
  }

  try {
    log('\n' + '='.repeat(50), 'cyan')
    log('🎵 Генерация TTS Аудио', 'cyan')
    log('='.repeat(50), 'cyan')

    // Читаем текст из файла
    log(`\n📖 Чтение файла: ${inputFile}`, 'blue')
    const text = fs.readFileSync(inputFile, 'utf-8').trim()

    if (!text) {
      log('❌ Ошибка: файл пустой\n', 'red')
      process.exit(1)
    }

    log(`✅ Текст загружен (${text.length} символов)`, 'green')

    // Генерируем аудио
    const audioBuffer = await generateTTS(text, language)

    // Определяем путь для сохранения (в текущей директории)
    const outputPath = path.resolve(process.cwd(), outputFile)

    // Сохраняем файл
    log(`\n💾 Сохранение аудио файла: ${outputPath}`, 'blue')
    fs.writeFileSync(outputPath, audioBuffer)

    log(`\n✨ Готово!`, 'green')
    log(`   Файл сохранён: ${outputPath}`, 'green')
    log(`   Размер: ${(audioBuffer.length / 1024).toFixed(2)} KB`, 'green')
    log('\n' + '='.repeat(50) + '\n', 'cyan')

  } catch (error) {
    log(`\n❌ Ошибка: ${error.message}\n`, 'red')
    process.exit(1)
  }
}

// Запуск
main()
