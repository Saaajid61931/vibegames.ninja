import prisma from '../src/lib/prisma';

// Helper to wait
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const args = process.argv.slice(2);
  let gameId = args[0];
  let targetUrl = args[1] || 'http://localhost:3000';

  console.log(`Starting traffic simulation script...`);
  console.log(`Target URL: ${targetUrl}`);

  // Resolve gameId if not provided
  if (!gameId) {
    console.log('No gameId provided. Querying database for the first published game...');
    try {
      const firstGame = await prisma.game.findFirst({
        where: { status: 'PUBLISHED' },
        select: { id: true, title: true, slug: true }
      });
      if (!firstGame) {
        console.error('No published games found in the database. Please provide a gameId manually.');
        process.exit(1);
      }
      gameId = firstGame.id;
      console.log(`Resolved game: "${firstGame.title}" (slug: ${firstGame.slug}, ID: ${gameId})`);
    } catch (err: any) {
      console.error('Failed to query database for gameId. Please provide a gameId as the first argument.');
      console.error(err.message);
      process.exit(1);
    }
  }

  // Now run the requests
  const count = 100;
  console.log(`Simulating ${count} unique plays/visitors on game ID: ${gameId}...`);

  // Target endpoint is targetUrl + /api/games/[id]/play
  const playUrl = `${targetUrl.replace(/\/$/, '')}/api/games/${gameId}/play`;
  console.log(`Target endpoint: ${playUrl}`);

  let successCount = 0;
  let failCount = 0;

  // Send requests in small batches of 10 to avoid socket exhaustion
  const batchSize = 10;
  for (let i = 0; i < count; i += batchSize) {
    const promises = [];
    const currentBatchSize = Math.min(batchSize, count - i);
    
    for (let j = 0; j < currentBatchSize; j++) {
      const reqId = i + j + 1;
      promises.push(
        (async () => {
          try {
            // By not passing any cookies, each request is treated as a new unique player/visitor by the play endpoint
            const res = await fetch(playUrl, {
              method: 'POST',
              headers: {
                'User-Agent': `VibeGamesTrafficSim/1.0 (Visitor #${reqId})`,
                'Content-Type': 'application/json',
              }
            });
            
            if (res.ok) {
              const data = await res.json();
              if (data.tracked) {
                successCount++;
              } else {
                failCount++;
              }
            } else {
              failCount++;
              console.error(`Request #${reqId} failed with status: ${res.status}`);
            }
          } catch (err: any) {
            failCount++;
            console.error(`Request #${reqId} errored:`, err.message);
          }
        })()
      );
    }
    
    await Promise.all(promises);
    console.log(`Progress: ${i + currentBatchSize}/${count} simulated visits completed...`);
    await sleep(100); // Tiny pause between batches
  }

  console.log('\n--- Simulation Complete ---');
  console.log(`Successful unique visits: ${successCount}`);
  console.log(`Failed visits: ${failCount}`);
  
  if (successCount >= count) {
    console.log('SUCCESS: Successfully simulated 100+ unique plays/visits!');
  } else {
    console.log('WARNING: Some requests failed. Total success was below 100.');
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    // Disconnect prisma if it was initialized
    try {
      await prisma.$disconnect();
    } catch {}
  });
