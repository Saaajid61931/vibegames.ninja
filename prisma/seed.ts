import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vibegames.ai' },
    update: {},
    create: {
      email: 'admin@vibegames.ai',
      name: 'Admin',
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  })
  console.log('Created admin user:', admin.email)

  // Create demo creator
  const creatorPassword = await bcrypt.hash('creator123', 12)
  const creator = await prisma.user.upsert({
    where: { email: 'creator@example.com' },
    update: {},
    create: {
      email: 'creator@example.com',
      name: 'Demo Creator',
      username: 'democreator',
      password: creatorPassword,
      role: 'CREATOR',
      bio: 'I make fun games with AI!',
    },
  })
  console.log('Created demo creator:', creator.email)

  console.log('Seeding complete - no demo games seeded!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
