/**
 * Тестовый скрипт для проверки PDF генерации
 * Запуск: node scripts/test-pdf-generation.js
 */

async function testPDFGeneration() {
  try {
    console.log('🧪 Testing PDF generation...\n')

    const testData = {
      vnd: '**ВНД: КЛЮЧЕВЫЕ ВЫВОДЫ**\nТестовый текст для проверки генерации PDF.',
      np: '**НПА: КЛЮЧЕВЫЕ ВЫВОДЫ**\nТестовый текст для проверки.',
      summary: '**ПУНКТ ПОВЕСТКИ ДНЯ:** Тестовый документ\n\n**РЕШЕНИЕ:** ЗА\n\n**КРАТКОЕ ЗАКЛЮЧЕНИЕ:** Все хорошо.',
      fileName: 'test-document',
      language: 'ru'
    }

    console.log('📤 Sending POST request to /api/export-pdf...')
    const startTime = Date.now()

    const response = await fetch('http://localhost:3000/api/export-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })

    const duration = Date.now() - startTime

    console.log(`\n📊 Response status: ${response.status} ${response.statusText}`)
    console.log(`⏱️  Duration: ${duration}ms`)
    console.log(`📦 Content-Type: ${response.headers.get('content-type')}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error response:', errorText)
      return
    }

    const data = await response.json()
    console.log('\n✅ Response data:')
    console.log('  - success:', data.success)
    console.log('  - pdfId:', data.pdfId)
    console.log('  - downloadUrl:', data.downloadUrl)
    console.log('  - size:', data.size, 'bytes')

    // Теперь пробуем скачать PDF
    console.log('\n📥 Testing PDF download...')
    const downloadResponse = await fetch(data.downloadUrl)
    
    console.log(`\n📊 Download status: ${downloadResponse.status} ${downloadResponse.statusText}`)
    console.log(`📦 Content-Type: ${downloadResponse.headers.get('content-type')}`)
    console.log(`📏 Content-Length: ${downloadResponse.headers.get('content-length')}`)

    if (downloadResponse.ok) {
      const pdfBuffer = await downloadResponse.arrayBuffer()
      console.log(`✅ PDF downloaded: ${pdfBuffer.byteLength} bytes`)
      
      // Проверяем что это действительно PDF
      const header = new Uint8Array(pdfBuffer.slice(0, 4))
      const isPDF = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46 // %PDF
      console.log(`✅ Is valid PDF: ${isPDF}`)
      
      if (isPDF) {
        console.log('\n🎉 PDF generation and download working correctly!')
      } else {
        console.log('\n⚠️  Downloaded file is not a valid PDF!')
      }
    } else {
      const errorText = await downloadResponse.text()
      console.error('❌ Download failed:', errorText)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('\n💡 Possible issues:')
    console.error('   - Next.js server is not running (check: http://localhost:3000)')
    console.error('   - PDF generation library issues')
    console.error('   - Memory issues')
  }
}

testPDFGeneration()
