const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('\n📋 Пользователи в базе данных:\n')
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'Без имени'}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Роль: ${user.role}`)
      console.log(`   Создан: ${user.createdAt.toLocaleString('ru-RU')}`)
      console.log('')
    })

    console.log(`Всего пользователей: ${users.length}\n`)
  } catch (error) {
    console.error('❌ Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
