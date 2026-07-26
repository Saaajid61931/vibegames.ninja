import prisma from './src/lib/prisma';

async function test() {
  const userCount = await prisma.user.count();
  const gameCount = await prisma.game.count();
  const analyticCount = await prisma.gameAnalytics.count();
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true }
  });
  const games = await prisma.game.findMany({
    select: { id: true, title: true, slug: true, status: true, plays: true }
  });
  console.log('--- DATABASE STATUS ---');
  console.log(`Users (${userCount}):`, users);
  console.log(`Games (${gameCount}):`, games);
  console.log(`Analytics entries: ${analyticCount}`);
}

test()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
