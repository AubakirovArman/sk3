/**
 * Скрипт для просмотра содержимого сгенерированного PDF
 * Запуск: node scripts/view-pdf-content.js
 */

const fs = require('fs')

async function viewPDFContent() {
  try {
    console.log('🔍 Viewing PDF structure...\n')

    // Генерируем новый PDF
    const response = await fetch('http://localhost:3000/api/export-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vnd: '**ВНД: КЛЮЧЕВЫЕ ВЫВОДЫ**\nЭтот текст НЕ должен быть в PDF.',
        np: '**НПА: КЛЮЧЕВЫЕ ВЫВОДЫ**\nЭтот текст также НЕ должен быть в PDF.',
        summary: `**ПУНКТ ПОВЕСТКИ ДНЯ:** Об утверждении положения о Совете директоров

**РЕШЕНИЕ НЕЗАВИСИМОГО ЧЛЕНА СД:** ЗА - единогласно

**КРАТКОЕ ЗАКЛЮЧЕНИЕ:** Положение рекомендовано к утверждению без замечаний.

**ОБОСНОВАНИЕ:** Документ полностью соответствует требованиям корпоративного управления.

**ИТОГОВОЕ ЗАКЛЮЧЕНИЕ:** Документ соответствует всем требованиям законодательства.`,
        fileName: 'test-document',
        language: 'ru'
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ PDF generated:', data.pdfId)
    console.log('📏 Size:', data.size, 'bytes\n')

    // Скачиваем PDF
    const downloadResponse = await fetch(data.downloadUrl)
    const pdfBuffer = await downloadResponse.arrayBuffer()
    
    // Сохраняем во временный файл
    const tempFile = '/tmp/test-analysis.pdf'
    fs.writeFileSync(tempFile, Buffer.from(pdfBuffer))
    console.log('💾 PDF saved to:', tempFile)

    // Пытаемся извлечь текст с помощью strings (работает на macOS)
    const { execSync } = require('child_process')
    
    try {
      console.log('\n📄 Extracting text from PDF...\n')
      const text = execSync(`strings "${tempFile}" | grep -i -E "(решение|пункт|заключение|внд|нпа|документ)" | head -30`).toString()
      console.log('Found keywords:')
      console.log('─'.repeat(80))
      console.log(text)
      console.log('─'.repeat(80))
      
      // Проверяем что ВНД и НПА НЕ присутствуют
      const hasVND = text.toLowerCase().includes('внд:') || text.toLowerCase().includes('внутренние нормативные')
      const hasNPA = text.toLowerCase().includes('нпа:') || text.toLowerCase().includes('нормативно-правовые')
      const hasSummary = text.toLowerCase().includes('решение') || text.toLowerCase().includes('заключение')
      
      console.log('\n✅ Validation:')
      console.log(`  - Has Summary content: ${hasSummary ? '✓' : '✗'}`)
      console.log(`  - Has VND section: ${hasVND ? '✗ (should not be present!)' : '✓ (correctly removed)'}`)
      console.log(`  - Has NPA section: ${hasNPA ? '✗ (should not be present!)' : '✓ (correctly removed)'}`)
      
      if (!hasVND && !hasNPA && hasSummary) {
        console.log('\n🎉 PDF contains only Summary content as expected!')
      } else {
        console.log('\n⚠️  PDF structure might need review')
      }
      
    } catch (error) {
      console.log('ℹ️  Could not extract text (strings command might not be available)')
      console.log('   But PDF was generated successfully!')
    }

    console.log('\n💡 To view the PDF:')
    console.log(`   open ${tempFile}`)

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

viewPDFContent()
