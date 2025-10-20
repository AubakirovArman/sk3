const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔄 Creating admin users...\n')
    
    // Создаем admin
    const admin1 = await prisma.user.upsert({
      where: { email: 'admin' },
      update: {
        password: await bcrypt.hash('admin', 10),
        role: 'admin',
        name: 'Administrator 1'
      },
      create: {
        name: 'Administrator 1',
        email: 'admin',
        password: await bcrypt.hash('admin', 10),
        role: 'admin',
      }
    })
    console.log('✅ Created/Updated admin:', {
      id: admin1.id,
      name: admin1.name,
      email: admin1.email,
      role: admin1.role
    })

    // Создаем admin2
    const admin2 = await prisma.user.upsert({
      where: { email: 'admin2' },
      update: {
        password: await bcrypt.hash('admin2', 10),
        role: 'admin',
        name: 'Administrator 2'
      },
      create: {
        name: 'Administrator 2',
        email: 'admin2',
        password: await bcrypt.hash('admin2', 10),
        role: 'admin',
      }
    })
    console.log('✅ Created/Updated admin2:', {
      id: admin2.id,
      name: admin2.name,
      email: admin2.email,
      role: admin2.role
    })

    console.log('\n✨ Successfully created 2 admin users!')
    console.log('\n📝 Login credentials:')
    console.log('   User 1: admin / admin')
    console.log('   User 2: admin2 / admin2')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
