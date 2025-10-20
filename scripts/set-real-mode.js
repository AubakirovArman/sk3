const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setRealMode() {
  try {
    console.log('🔬 Setting real mode...')

    await prisma.dialogSettings.upsert({
      where: { key: 'virtual_director_mode' },
      update: { value: 'real' },
      create: { key: 'virtual_director_mode', value: 'real' }
    })
    console.log('✅ Mode set to: real')

    console.log('🎉 Real mode activated successfully!')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setRealMode()
