/**
 * Скрипт для проверки наличия демо данных в БД
 * Запуск: node scripts/check-demo-data.js
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkDemoData() {
  try {
    console.log('🔍 Checking demo data in database...\n')

    // Проверяем режим
    const modeRecord = await prisma.dialogSettings.findUnique({
      where: { key: 'virtual-director-mode' }
    })

    if (modeRecord) {
      console.log(`✅ Mode: ${modeRecord.value}`)
    } else {
      console.log('❌ Mode not set')
    }

    // Проверяем демо данные
    const demoDataRecord = await prisma.dialogSettings.findUnique({
      where: { key: 'virtual-director-demo-data' }
    })

    if (demoDataRecord) {
      const demoData = JSON.parse(demoDataRecord.value)
      const fields = Object.keys(demoData)
      console.log(`✅ Demo data exists with ${fields.length} fields`)
      
      // Проверяем заполненность по языкам
      let ruCount = 0, kkCount = 0, enCount = 0
      
      fields.forEach(field => {
        if (demoData[field]?.ru) ruCount++
        if (demoData[field]?.kk) kkCount++
        if (demoData[field]?.en) enCount++
      })
      
      console.log(`   - RU: ${ruCount}/${fields.length} fields filled`)
      console.log(`   - KK: ${kkCount}/${fields.length} fields filled`)
      console.log(`   - EN: ${enCount}/${fields.length} fields filled`)
    } else {
      console.log('❌ Demo data NOT found')
      console.log('\n📝 To fix this:')
      console.log('   1. Go to http://localhost:3000/admin/virtual-director')
      console.log('   2. Switch to "Демо режим" tab')
      console.log('   3. Fill in all fields for all languages')
      console.log('   4. Click "Сохранить настройки"')
    }

    // Проверяем аудио файлы
    console.log('\n🎤 Checking audio files...')
    
    const languages = ['ru', 'kk', 'en']
    for (const lang of languages) {
      const audioRecord = await prisma.dialogSettings.findUnique({
        where: { key: `virtual-director-demo-audio-${lang}` }
      })
      
      if (audioRecord) {
        const audioData = JSON.parse(audioRecord.value)
        const totalSize = (audioData.vnd.length + audioData.np.length + audioData.summary.length) / 1024
        console.log(`✅ ${lang.toUpperCase()} audio: ${totalSize.toFixed(0)} KB (generated: ${audioData.generatedAt})`)
      } else {
        console.log(`❌ ${lang.toUpperCase()} audio: NOT found`)
      }
    }

    console.log('\n✨ Check complete!')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDemoData()
