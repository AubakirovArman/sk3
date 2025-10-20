/**
 * Утилиты для очистки текста перед озвучкой (TTS)
 * Удаляет Markdown разметку и лишние символы
 */

/**
 * Очистка текста для TTS
 * Удаляет:
 * - Markdown разметку (**, *, _, ~~, [], (), #, >, -)
 * - Множественные пробелы и переносы строк
 * - Лишние символы пунктуации
 * 
 * Сохраняет:
 * - Точки, запятые, восклицательные и вопросительные знаки
 * - Двоеточия (для естественного звучания)
 * - Тире и дефисы (заменяются на паузы)
 */
export function sanitizeTextForTTS(text: string): string {
  if (!text) return ''

  let cleaned = text

  // 1. Удаляем Markdown заголовки (### Заголовок → Заголовок)
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '')

  // 2. Удаляем жирный текст и курсив (**текст** или __текст__ → текст)
  cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, '$1')
  cleaned = cleaned.replace(/__(.+?)__/g, '$1')
  cleaned = cleaned.replace(/\*(.+?)\*/g, '$1')
  cleaned = cleaned.replace(/_(.+?)_/g, '$1')

  // 3. Удаляем зачёркнутый текст (~~текст~~ → текст)
  cleaned = cleaned.replace(/~~(.+?)~~/g, '$1')

  // 4. Удаляем ссылки ([текст](url) → текст)
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

  // 5. Удаляем маркеры списков (- пункт или * пункт → пункт)
  cleaned = cleaned.replace(/^[\s]*[-*+]\s+/gm, '')

  // 6. Удаляем нумерацию списков (1. пункт → пункт)
  cleaned = cleaned.replace(/^[\s]*\d+\.\s+/gm, '')

  // 7. Удаляем блоки цитат (> текст → текст)
  cleaned = cleaned.replace(/^>\s+/gm, '')

  // 8. Удаляем горизонтальные линии (---, ***, ___)
  cleaned = cleaned.replace(/^[\s]*[-*_]{3,}[\s]*$/gm, '')

  // 9. Удаляем inline code (`код` → код)
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1')

  // 10. Удаляем блоки кода (```код``` → код)
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '')

  // 11. Заменяем двоеточие с пробелом на двоеточие без пробела (для естественности)
  cleaned = cleaned.replace(/:\s+/g, ': ')

  // 12. Удаляем множественные пробелы
  cleaned = cleaned.replace(/\s{2,}/g, ' ')

  // 13. Удаляем множественные переносы строк (оставляем один для паузы)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')

  // 14. Заменяем переносы строк на точку с пробелом (для естественных пауз)
  cleaned = cleaned.replace(/\n+/g, '. ')

  // 15. Удаляем множественные точки
  cleaned = cleaned.replace(/\.{2,}/g, '.')

  // 16. Удаляем точку перед запятой или другой точкой
  cleaned = cleaned.replace(/\.\s*([,;.])/g, '$1')

  // 17. Убираем пробелы перед знаками препинания
  cleaned = cleaned.replace(/\s+([.,;:!?])/g, '$1')

  // 18. Добавляем пробел после знаков препинания (если его нет)
  cleaned = cleaned.replace(/([.,;:!?])([^\s\d])/g, '$1 $2')

  // 19. Убираем пробелы в начале и конце
  cleaned = cleaned.trim()

  // 20. Удаляем двойные пробелы (на всякий случай)
  cleaned = cleaned.replace(/\s{2,}/g, ' ')

  return cleaned
}

/**
 * Сокращение текста для TTS (опционально)
 * Если текст слишком длинный, можно взять только начало
 */
export function truncateTextForTTS(text: string, maxLength: number = 5000): string {
  if (text.length <= maxLength) return text

  // Обрезаем по максимальной длине
  let truncated = text.substring(0, maxLength)

  // Ищем последнюю точку, чтобы не обрывать на полуслове
  const lastPeriod = truncated.lastIndexOf('.')
  if (lastPeriod > maxLength * 0.8) {
    // Если точка близко к концу, обрезаем там
    truncated = truncated.substring(0, lastPeriod + 1)
  } else {
    // Иначе добавляем многоточие
    truncated = truncated + '...'
  }

  return truncated
}

/**
 * Полная обработка текста для TTS
 * Очищает и при необходимости обрезает
 */
export function prepareTextForTTS(text: string, maxLength?: number): string {
  // Сначала очищаем
  let prepared = sanitizeTextForTTS(text)

  // Затем обрезаем, если нужно
  if (maxLength && prepared.length > maxLength) {
    prepared = truncateTextForTTS(prepared, maxLength)
  }

  return prepared
}

/**
 * Примеры использования:
 * 
 * const markdown = `
 * **ПУНКТ ПОВЕСТКИ ДНЯ:** Утверждение изменений
 * 
 * ### Краткое заключение
 * 
 * - Пункт 1
 * - Пункт 2
 * 
 * **Решение:** ЗА
 * `
 * 
 * const cleaned = sanitizeTextForTTS(markdown)
 * // "ПУНКТ ПОВЕСТКИ ДНЯ: Утверждение изменений. Краткое заключение. Пункт 1. Пункт 2. Решение: ЗА"
 * 
 * const prepared = prepareTextForTTS(markdown, 200)
 * // "ПУНКТ ПОВЕСТКИ ДНЯ: Утверждение изменений. Краткое заключение. Пункт 1. Пункт 2..."
 */
