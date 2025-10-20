#!/usr/bin/env node

/**
 * Скрипт для тестирования авторизации через API
 * 
 * Использование:
 *   node scripts/test-auth.js <url> <username> <password>
 * 
 * Примеры:
 *   node scripts/test-auth.js https://app4.sk-ai.kz admin admin
 *   node scripts/test-auth.js http://localhost:3001 admin admin
 */

const args = process.argv.slice(2)

if (args.length < 3) {
  console.log('\n❌ Недостаточно аргументов\n')
  console.log('Использование:')
  console.log('  node scripts/test-auth.js <url> <username> <password>\n')
  console.log('Примеры:')
  console.log('  node scripts/test-auth.js https://app4.sk-ai.kz admin admin')
  console.log('  node scripts/test-auth.js http://localhost:3001 admin admin\n')
  process.exit(1)
}

const [baseUrl, username, password] = args

async function testAuth() {
  try {
    console.log('\n🔐 Тестирование авторизации...')
    console.log('─'.repeat(50))
    console.log(`🌐 URL: ${baseUrl}`)
    console.log(`👤 Username: ${username}`)
    console.log(`🔑 Password: ${'*'.repeat(password.length)}`)
    console.log('─'.repeat(50))

    // 1. Проверяем доступность сервера
    console.log('\n1️⃣ Проверка доступности сервера...')
    try {
      const healthCheck = await fetch(baseUrl)
      console.log(`   ✅ Сервер доступен (${healthCheck.status})`)
    } catch (error) {
      console.log(`   ⚠️ Ошибка подключения: ${error.message}`)
    }

    // 2. Получаем CSRF токен
    console.log('\n2️⃣ Получение CSRF токен...')
    const csrfUrl = `${baseUrl}/api/auth/csrf`
    console.log(`   URL: ${csrfUrl}`)
    
    const csrfResponse = await fetch(csrfUrl)
    const csrfData = await csrfResponse.json()
    
    if (csrfData.csrfToken) {
      console.log(`   ✅ CSRF токен получен: ${csrfData.csrfToken.substring(0, 20)}...`)
    } else {
      console.log(`   ❌ CSRF токен не получен`)
      console.log(`   Ответ:`, csrfData)
    }

    // 3. Пробуем авторизоваться
    console.log('\n3️⃣ Попытка авторизации...')
    const authUrl = `${baseUrl}/api/auth/callback/credentials`
    console.log(`   URL: ${authUrl}`)

    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password,
        csrfToken: csrfData.csrfToken,
        callbackUrl: `${baseUrl}/`,
        json: true,
      }),
      redirect: 'manual', // Не следовать редиректам
    })

    console.log(`   Статус: ${authResponse.status} ${authResponse.statusText}`)
    console.log(`   Headers:`)
    authResponse.headers.forEach((value, key) => {
      console.log(`     ${key}: ${value}`)
    })

    if (authResponse.status === 401) {
      console.log('\n   ❌ Авторизация не удалась (401 Unauthorized)')
      console.log('   Возможные причины:')
      console.log('   - Неверный логин или пароль')
      console.log('   - Пользователь не существует в БД')
      console.log('   - Проблема с хешированием пароля')
      console.log('   - Ошибка подключения к базе данных на сервере')
    } else if (authResponse.status === 200 || authResponse.status === 302) {
      console.log('\n   ✅ Авторизация успешна!')
      
      const responseText = await authResponse.text()
      if (responseText) {
        try {
          const responseData = JSON.parse(responseText)
          console.log('   Ответ:', responseData)
        } catch {
          console.log('   Ответ (текст):', responseText.substring(0, 200))
        }
      }
    } else {
      console.log(`\n   ⚠️ Неожиданный статус: ${authResponse.status}`)
      const responseText = await authResponse.text()
      console.log('   Ответ:', responseText.substring(0, 500))
    }

    // 4. Проверяем переменные окружения на сервере
    console.log('\n4️⃣ Проверка конфигурации...')
    console.log('   💡 Убедитесь что на сервере установлены:')
    console.log('   - NEXTAUTH_SECRET (любая секретная строка)')
    console.log('   - NEXTAUTH_URL (должен быть https://app4.sk-ai.kz)')
    console.log('   - DATABASE_URL (подключение к PostgreSQL)')

    console.log('\n' + '─'.repeat(50))
    console.log('✨ Тест завершён\n')

  } catch (error) {
    console.error('\n❌ Ошибка:', error.message)
    console.error('Stack:', error.stack)
  }
}

testAuth()
