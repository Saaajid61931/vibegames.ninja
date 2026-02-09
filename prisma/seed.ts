import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { addDays } from 'date-fns'

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

  // Create demo games
  const now = new Date()
  const games = [
    {
      slug: 'neon-swing',
      title: 'Neon Swing',
      description: 'A challenging swinging game with neon aesthetics. Swing through the obstacles and reach the end!',
      instructions: 'Click to attach your rope and swing. Release to let go. Avoid obstacles and reach the goal.',
      thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop',
      category: 'ACTION',
      tags: 'arcade, neon, swing, physics, challenging',
      aiTool: 'claude',
      aiModel: 'claude-3-5-sonnet',
      isAIGenerated: true,
      gameUrl: '/sample-games/Neon Swing/index.html',
      status: 'PUBLISHED',
      plays: 1247,
      likes: 156,
      publishedAt: now,
      isPermanent: true,
      expiresAt: null,
      supportsMobile: true,
    },
    {
      slug: 'space-invaders-ai',
      title: 'Space Invaders AI',
      description: 'Classic space invaders reimagined with AI. Defend Earth from the alien invasion!',
      instructions: 'Arrow keys to move, Space to shoot. Destroy all aliens before they reach you.',
      thumbnail: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=300&fit=crop',
      category: 'ARCADE',
      tags: 'retro, shooter, aliens, space, classic',
      aiTool: 'chatgpt',
      aiModel: 'gpt-4o',
      isAIGenerated: true,
      gameUrl: '/sample-games/index.html',
      status: 'PUBLISHED',
      plays: 856,
      likes: 67,
      publishedAt: addDays(now, -1),
      isPermanent: false,
      expiresAt: addDays(now, 2),
      supportsMobile: true,
    },
    {
      slug: 'puzzle-quest',
      title: 'Puzzle Quest',
      description: 'A relaxing puzzle game where you match colors and solve increasingly difficult challenges.',
      instructions: 'Click and drag to swap tiles. Match 3 or more of the same color.',
      thumbnail: 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=400&h=300&fit=crop',
      category: 'PUZZLE',
      tags: 'puzzle, relaxing, colors, match-3, casual',
      aiTool: 'cursor',
      aiModel: 'claude-3-5-sonnet',
      isAIGenerated: true,
      gameUrl: '/sample-games/index.html',
      status: 'PUBLISHED',
      plays: 2341,
      likes: 98,
      publishedAt: addDays(now, -2),
      isPermanent: false,
      expiresAt: addDays(now, 1),
      supportsMobile: true,
    },
    {
      slug: 'racing-fury',
      title: 'Racing Fury',
      description: 'High-speed racing through neon cityscapes. Drift, boost, and leave your opponents in the dust!',
      instructions: 'Arrow keys to steer, Space for boost, Shift to drift.',
      thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
      category: 'RACING',
      tags: 'racing, speed, cars, neon, drift',
      aiTool: 'gemini',
      aiModel: 'gemini-1.5-pro',
      isAIGenerated: true,
      gameUrl: '/sample-games/index.html',
      status: 'PUBLISHED',
      plays: 1893,
      likes: 34,
      publishedAt: now,
      isPermanent: false,
      expiresAt: addDays(now, 3),
      supportsMobile: false,
    },
    {
      slug: 'dungeon-crawler-roguelike',
      title: 'Dungeon Crawler',
      description: 'Explore procedurally generated dungeons, fight monsters, and collect loot in this addictive roguelike adventure.',
      instructions: 'WASD to move, click to attack. Find the exit on each floor. Permadeath - be careful!',
      thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=300&fit=crop',
      category: 'RPG',
      tags: 'roguelike, dungeon, rpg, adventure, fantasy',
      aiTool: 'claude',
      aiModel: 'claude-3-opus',
      isAIGenerated: true,
      gameUrl: '/sample-games/index.html',
      status: 'PUBLISHED',
      plays: 2340,
      likes: 178,
      publishedAt: addDays(now, -5),
      isPermanent: true,
      expiresAt: null,
      supportsMobile: false,
    },
    {
      slug: 'flappy-extreme',
      title: 'Flappy Extreme',
      description: 'The classic flappy gameplay with extreme twists! Moving pipes, power-ups, and boss battles await.',
      instructions: 'Click or press spacebar to flap. Avoid the pipes and collect stars for bonus points.',
      thumbnail: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=400&h=300&fit=crop',
      category: 'ARCADE',
      tags: 'flappy, casual, arcade, endless, highscore',
      aiTool: 'chatgpt',
      aiModel: 'gpt-4-turbo',
      isAIGenerated: true,
      gameUrl: '/sample-games/index.html',
      status: 'PUBLISHED',
      plays: 8920,
      likes: 445,
      publishedAt: addDays(now, -10),
      isPermanent: true,
      expiresAt: null,
      supportsMobile: true,
    },
    {
      slug: 'tower-defense-ai',
      title: 'Tower Defense AI',
      description: 'Build towers, upgrade defenses, and stop waves of AI-controlled enemies from reaching your base.',
      instructions: 'Click to place towers. Upgrade them between waves. Don\'t let enemies reach the end!',
      thumbnail: 'https://images.unsplash.com/photo-1563207153-f403bf289096?w=400&h=300&fit=crop',
      category: 'STRATEGY',
      tags: 'tower-defense, strategy, waves, building, tactics',
      aiTool: 'claude',
      aiModel: 'claude-3-5-sonnet',
      isAIGenerated: true,
      gameUrl: '/sample-games/index.html',
      status: 'PUBLISHED',
      plays: 4560,
      likes: 289,
      publishedAt: addDays(now, -7),
      isPermanent: true,
      expiresAt: null,
      supportsMobile: true,
    },
    {
      slug: 'memory-match-pro',
      title: 'Memory Match Pro',
      description: 'Test your memory with this beautiful card matching game. Multiple themes and difficulty levels!',
      instructions: 'Click cards to flip them. Match pairs to clear the board. Complete in fewer moves for higher scores.',
      thumbnail: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400&h=300&fit=crop',
      category: 'PUZZLE',
      tags: 'memory, cards, brain, casual, matching',
      aiTool: 'gemini',
      aiModel: 'gemini-1.5-flash',
      isAIGenerated: true,
      gameUrl: '/sample-games/index.html',
      status: 'PUBLISHED',
      plays: 6780,
      likes: 312,
      publishedAt: addDays(now, -4),
      isPermanent: true,
      expiresAt: null,
      supportsMobile: true,
    },
    {
      slug: 'snake-evolution',
      title: 'Snake Evolution',
      description: 'The classic snake game evolved! Eat food, grow longer, and unlock new abilities as you level up.',
      instructions: 'Arrow keys or WASD to control the snake. Eat food to grow. Don\'t hit walls or yourself!',
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop',
      category: 'ARCADE',
      tags: 'snake, classic, retro, arcade, casual',
      aiTool: 'cursor',
      aiModel: 'claude-3-5-sonnet',
      isAIGenerated: true,
      gameUrl: '/sample-games/index.html',
      status: 'PUBLISHED',
      plays: 7890,
      likes: 398,
      publishedAt: addDays(now, -6),
      isPermanent: true,
      expiresAt: null,
      supportsMobile: true,
    },
    {
      slug: 'word-wizard',
      title: 'Word Wizard',
      description: 'Create words from scrambled letters! Daily challenges, multiplayer mode, and thousands of puzzles.',
      instructions: 'Drag letters to form words. Longer words score more points. Find all words to complete the level.',
      thumbnail: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&h=300&fit=crop',
      category: 'WORD',
      tags: 'word, puzzle, vocabulary, brain, educational',
      aiTool: 'chatgpt',
      aiModel: 'gpt-4o',
      isAIGenerated: true,
      gameUrl: '/sample-games/index.html',
      status: 'PUBLISHED',
      plays: 5430,
      likes: 267,
      publishedAt: addDays(now, -3),
      isPermanent: true,
      expiresAt: null,
      supportsMobile: true,
    },
  ]

  for (const gameData of games) {
    const game = await prisma.game.upsert({
      where: { slug: gameData.slug },
      update: gameData,
      create: {
        ...gameData,
        creatorId: creator.id,
      },
    })
    console.log(`Created game: ${game.title} (${game.likes} likes)`)
  }

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
