const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔄 Обновление пользователя admin2...\n')
    
    // Обновляем admin2
    const updatedUser = await prisma.user.update({
      where: { id: 'cmgtdnibr0001yclptuxqajgt' },
      data: {
        email: 'admin2',
        role: 'dialog_admin',
        password: await bcrypt.hash('admin2', 10),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    })

    console.log('✅ Пользователь обновлён:')
    console.log(`   Имя: ${updatedUser.name}`)
    console.log(`   Email: ${updatedUser.email}`)
    console.log(`   Роль: ${updatedUser.role}`)
    console.log('\n📝 Теперь можно войти:')
    console.log('   Логин: admin2')
    console.log('   Пароль: admin2')
    console.log('   Доступ к /dialog/admin: ✅')
    
  } catch (error) {
    console.error('❌ Ошибка:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
