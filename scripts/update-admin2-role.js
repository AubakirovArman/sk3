const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    const user = await prisma.user.update({
      where: { email: 'admin2' },
      data: { role: 'dialog_admin' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    })

    console.log('✅ Updated admin2 role to dialog_admin:', user)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
