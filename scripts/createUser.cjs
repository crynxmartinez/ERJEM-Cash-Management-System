const bcrypt = require('bcryptjs')

async function createUser() {
  const { PrismaClient } = require('@prisma/client')
  const prisma = new PrismaClient()

  try {
    const hashedPassword = await bcrypt.hash('jovanni', 10)
    
    const user = await prisma.user.upsert({
      where: { email: 'jovanni@martinez.com' },
      update: {
        password: hashedPassword,
        displayName: 'Jovanni Martinez'
      },
      create: {
        email: 'jovanni@martinez.com',
        password: hashedPassword,
        displayName: 'Jovanni Martinez'
      }
    })

    console.log('User created:', user)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createUser()
