#!/usr/bin/env node

/**
 * Скрипт для проверки пользователей в БД
 * Показывает всех пользователей и проверяет пароли
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    console.log('\n🔍 Проверка пользователей в базе данных...\n')

    // Получаем всех пользователей
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
        createdAt: true,
      }
    })

    if (users.length === 0) {
      console.log('❌ Пользователи не найдены в базе данных')
      console.log('\n💡 Подсказка: Создайте пользователя с помощью скрипта create-admin.js')
      return
    }

    console.log(`✅ Найдено пользователей: ${users.length}\n`)

    for (const user of users) {
      console.log('─'.repeat(50))
      console.log(`📧 Email: ${user.email}`)
      console.log(`👤 Имя: ${user.name || 'не указано'}`)
      console.log(`🔑 Роль: ${user.role}`)
      console.log(`📅 Создан: ${user.createdAt.toLocaleString('ru-RU')}`)
      console.log(`🔒 Пароль: ${user.password ? 'есть (хеш)' : 'НЕТ'}`)
      
      if (user.password) {
        // Проверяем, какой пароль может подойти
        const testPasswords = ['admin', 'password', '123456', 'admin123']
        for (const testPass of testPasswords) {
          const isMatch = await bcrypt.compare(testPass, user.password)
          if (isMatch) {
            console.log(`   ✅ Пароль: "${testPass}"`)
            break
          }
        }
      }
      console.log()
    }

    console.log('─'.repeat(50))

  } catch (error) {
    console.error('\n❌ Ошибка:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
