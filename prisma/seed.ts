import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { addDays } from 'date-fns'

const prisma = new PrismaClient()

// Retention constants
const RETENTION_DAYS = 3
const LIKES_FOR_PERMANENT = 100

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

  // Create demo games with varying retention statuses
  const now = new Date()
  const games = [
    {
      slug: 'neon-swing',
      title: 'Neon Swing',
      description: 'A challenging swinging game with neon aesthetics. Swing through the obstacles and reach the end!',
      instructions: 'Click to attach your rope and swing. Release to let go. Avoid obstacles and reach the goal.',
      category: 'ACTION',
      tags: 'arcade, neon, swing, physics, challenging',
      aiTool: 'claude',
      isAIGenerated: true,
      gameUrl: '/sample-games/Neon Swing/index.html',
      status: 'PUBLISHED',
      plays: 1247,
      likes: 156, // Over 100 = PERMANENT
      publishedAt: now,
      isPermanent: true,
      expiresAt: null,
    },
    {
      slug: 'space-invaders-ai',
      title: 'Space Invaders AI',
      description: 'Classic space invaders reimagined with AI. Defend Earth from the alien invasion!',
      instructions: 'Arrow keys to move, Space to shoot. Destroy all aliens before they reach you.',
      category: 'ARCADE',
      tags: 'retro, shooter, aliens, space, classic',
      aiTool: 'chatgpt',
      isAIGenerated: true,
      gameUrl: '/sample-games/index.html',
      status: 'PUBLISHED',
      plays: 856,
      likes: 67, // Under 100, has 2 days left
      publishedAt: addDays(now, -1),
      isPermanent: false,
      expiresAt: addDays(now, 2),
    },
    {
      slug: 'puzzle-quest',
      title: 'Puzzle Quest',
      description: 'A relaxing puzzle game where you match colors and solve increasingly difficult challenges.',
      instructions: 'Click and drag to swap tiles. Match 3 or more of the same color.',
      category: 'PUZZLE',
      tags: 'puzzle, relaxing, colors, match-3, casual',
      aiTool: 'cursor',
      isAIGenerated: true,
      gameUrl: '/sample-games/index.html',
      status: 'PUBLISHED',
      plays: 2341,
      likes: 98, // Close to permanent! Only 2 likes needed
      publishedAt: addDays(now, -2),
      isPermanent: false,
      expiresAt: addDays(now, 1), // Expiring soon!
    },
    {
      slug: 'racing-fury',
      title: 'Racing Fury',
      description: 'High-speed racing through neon cityscapes. Drift, boost, and leave your opponents in the dust!',
      instructions: 'Arrow keys to steer, Space for boost, Shift to drift.',
      category: 'RACING',
      tags: 'racing, speed, cars, neon, drift',
      aiTool: 'gemini',
      isAIGenerated: true,
      gameUrl: '/sample-games/index.html',
      status: 'PUBLISHED',
      plays: 1893,
      likes: 34, // Under 100, has 3 days (just uploaded)
      publishedAt: now,
      isPermanent: false,
      expiresAt: addDays(now, 3),
    },
  ]

  for (const gameData of games) {
    const game = await prisma.game.upsert({
      where: { slug: gameData.slug },
      update: {
        ...gameData,
        expiresAt: gameData.expiresAt,
        isPermanent: gameData.isPermanent,
      },
      create: {
        ...gameData,
        creatorId: creator.id,
      },
    })
    const status = game.isPermanent ? 'PERMANENT' : `expires in ${RETENTION_DAYS} days, needs ${LIKES_FOR_PERMANENT - game.likes} more likes`
    console.log(`Created game: ${game.title} (${status})`)
  }

  console.log('')
  console.log('=== RETENTION RULES ===')
  console.log(`- Games expire after ${RETENTION_DAYS} days`)
  console.log(`- Games with ${LIKES_FOR_PERMANENT}+ likes become PERMANENT`)
  console.log('')
  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
