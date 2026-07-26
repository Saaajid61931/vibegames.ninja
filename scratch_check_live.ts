async function main() {
  const res = await fetch('https://www.vibegames.ninja/');
  const html = await res.text();
  
  console.log('--- Checking Stats Elements ---');
  
  // Find the block with GAMES, CREATORS, and PLAYS
  const regex = /<div class="font-pixel text-base font-bold text-white sm:text-2xl md:text-3xl">([^<]+)<\/div>/g;
  let match;
  let matches = [];
  while ((match = regex.exec(html)) !== null) {
    matches.push(match[1]);
  }
  
  console.log('Found stats values:', matches);
}

main().catch(console.error);
