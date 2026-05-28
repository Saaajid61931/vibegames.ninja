export interface BlogContentBlock {
  type: "paragraph" | "heading" | "code" | "list";
  text?: string;
  code?: string;
  language?: string;
  items?: string[];
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: "TIPS_AND_TRICKS" | "AI_UPDATES" | "DEVLOGS";
  author: string;
  date: string;
  readTime: string;
  coverImage: string;
  tags: string[];
  content: BlogContentBlock[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: "post-1",
    slug: "ai-prompting-hooks-html5-games",
    title: "Mastering AI Game Dev: Prompting Hooks for HTML5 Games",
    excerpt: "Learn the exact instructions, loop designs, and browser canvas hooks you must feed LLMs like Claude or GPT to generate flawless, 60FPS browser-playable games.",
    category: "TIPS_AND_TRICKS",
    author: "Vibe Dev",
    date: "May 28, 2026",
    readTime: "5 min read",
    coverImage: "/Images/blog/prompt-hooks.png",
    tags: ["AI Dev", "HTML5", "Game Design"],
    content: [
      {
        type: "paragraph",
        text: "Building HTML5 browser games with LLMs (like Claude 3.5 Sonnet, ChatGPT, or Gemini) is incredibly fast, but AI models frequently fall into common traps: creating unoptimized loops, forgetting input cleanup, or writing code that overflows the screen. By feeding the AI specific 'code design hooks' in your initial prompt, you can ensure it writes robust, production-ready canvas code on the first attempt."
      },
      {
        type: "heading",
        text: "1. The Precise Canvas Setup Hook"
      },
      {
        type: "paragraph",
        text: "AI models often write canvas sizing that looks blurry on high-DPI (Retina) screens. Instruct the AI to handle device pixel ratio (DPR) explicitly using the hook below. This ensures sharp rendering under any screen scale."
      },
      {
        type: "code",
        language: "javascript",
        code: `// Sharp Canvas DPR Setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const dpr = window.devicePixelRatio || 1;
const rect = canvas.getBoundingClientRect();

canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;
ctx.scale(dpr, dpr);`
      },
      {
        type: "heading",
        text: "2. The Delta-Time Game Loop Hook"
      },
      {
        type: "paragraph",
        text: "Without strict instructions, AI models usually write frame-rate loops that bind speed directly to the browser's requestAnimationFrame speed (which differs on 60Hz, 120Hz, and 144Hz monitors). To ensure games play at the exact same speed for everyone, mandate delta-time calculations in your prompt:"
      },
      {
        type: "code",
        language: "javascript",
        code: `// Delta-time game loop hook
let lastTime = performance.now();
function gameLoop(currentTime) {
  requestAnimationFrame(gameLoop);
  const deltaTime = (currentTime - lastTime) / 1000; // time in seconds
  lastTime = currentTime;

  update(deltaTime);
  render();
}`
      },
      {
        type: "heading",
        text: "3. Input Listener Cleanup Hook"
      },
      {
        type: "paragraph",
        text: "When testing games, hot-reloading can cause keyboards to register duplicate keydown event listeners, leading to high speed boosts or crash loops. Force the AI to clean up input listeners or reuse a singleton keyboard tracker:"
      },
      {
        type: "code",
        language: "javascript",
        code: `// Keyboard controller listener singleton hook
if (window.gameInputs) {
  // Clean up previous event listeners before binding new ones
  window.removeEventListener("keydown", window.gameInputs.onKeyDown);
  window.removeEventListener("keyup", window.gameInputs.onKeyUp);
}

window.gameInputs = {
  keys: {},
  onKeyDown: (e) => { window.gameInputs.keys[e.code] = true; },
  onKeyUp: (e) => { window.gameInputs.keys[e.code] = false; }
};

window.addEventListener("keydown", window.gameInputs.onKeyDown);
window.addEventListener("keyup", window.gameInputs.onKeyUp);`
      },
      {
        type: "heading",
        text: "Put it all together in your prompt"
      },
      {
        type: "paragraph",
        text: "When initiating a project with Cursor or Claude, copy-paste this direct prompting constraint:"
      },
      {
        type: "code",
        language: "text",
        code: `Ensure the game uses a delta-time game loop independent of the display refresh rate.
Initialize the HTML5 Canvas to handle devicePixelRatio (DPR) correctly to prevent pixel blur.
Implement single-instance event listener bindings and export clean reset functions to prevent memory leaks during hot reload.`
      }
    ]
  },
  {
    id: "post-2",
    slug: "optimize-ai-games-vibegames",
    title: "How to Optimize AI-Generated Games for VibeGames.Ninja",
    excerpt: "Best practices for integrating level editors, ghost telemetry runs, and responsive fullscreen scaling into your AI game creations.",
    category: "AI_UPDATES",
    author: "Vibe Dev",
    date: "May 20, 2026",
    readTime: "4 min read",
    coverImage: "/Images/blog/optimize-games.png",
    tags: ["Platform SDK", "Optimization", "Ghost Races"],
    content: [
      {
        type: "paragraph",
        text: "VibeGames.Ninja offers native arcade features like Level Editors and Replay Ghost Racing. If your game is built with AI, you can integrate these features using simple JSON messages and structure hooks. Here is how to configure your AI game build to become a first-class citizen in our retro arcade catalog."
      },
      {
        type: "heading",
        text: "1. Responsive Fullscreen Scaling"
      },
      {
        type: "paragraph",
        text: "Your game runs inside an iframe wrapper. For the best mobile and desktop scaling, ensure your code scales the game board canvas to occupy 100% of the viewport width and height while maintaining aspect ratio:"
      },
      {
        type: "code",
        language: "javascript",
        code: `function resizeGame() {
  const container = document.body;
  const gameRatio = 16 / 9;
  let newWidth = container.clientWidth;
  let newHeight = container.clientHeight;

  if (newWidth / newHeight > gameRatio) {
    newWidth = newHeight * gameRatio;
  } else {
    newHeight = newWidth / gameRatio;
  }

  canvas.style.width = newWidth + 'px';
  canvas.style.height = newHeight + 'px';
}`
      },
      {
        type: "heading",
        text: "2. Emitting Level Data to the Platform"
      },
      {
        type: "paragraph",
        text: "If you enable the 'Community Level Editor' checkbox on VibeGames, your game needs a way to send the custom level designed by the player back to the platform. Emit a window postMessage containing the JSON payload when the level is saved:"
      },
      {
        type: "code",
        language: "javascript",
        code: `function saveCustomLevel(levelDataStructure) {
  window.parent.postMessage({
    source: "vibegames-sdk",
    type: "VG_SAVE_CUSTOM_LEVEL",
    payload: {
      levelName: "My custom track",
      data: levelDataStructure // JSON object
    }
  }, "*");
}`
      },
      {
        type: "heading",
        text: "3. Capturing Telemetry for Replay Ghosts"
      },
      {
        type: "paragraph",
        text: "For time-trials, tracking player movement coordinates every 100ms constructs a replay ghost. Save the path array as a JSON file and emit it to the platform at the end of the race:"
      },
      {
        type: "code",
        language: "javascript",
        code: `// Recording coordinates
let ghostRun = [];
setInterval(() => {
  if (gameActive) {
    ghostRun.push({ x: player.x, y: player.y, anim: player.currentAnim });
  }
}, 100);

// Emitting data when crossing the finish line
function onRaceComplete(finalDurationMs) {
  window.parent.postMessage({
    source: "vibegames-sdk",
    type: "VG_SUBMIT_GHOST_RUN",
    payload: {
      durationMs: finalDurationMs,
      replayData: ghostRun
    }
  }, "*");
}`
      }
    ]
  },
  {
    id: "post-3",
    slug: "ai-game-jam-48h-guide",
    title: "AI Game Jams: Go from Zero to Published in 48 Hours",
    excerpt: "A step-by-step roadmap to brainstorm, prototype, polish, and deploy an arcade entry using Cursor, Claude, and VibeGames.",
    category: "DEVLOGS",
    author: "Vibe Dev",
    date: "April 15, 2026",
    readTime: "6 min read",
    coverImage: "/Images/blog/game-jam-guide.png",
    tags: ["Game Jam", "Rapid Prototyping", "Devlog"],
    content: [
      {
        type: "paragraph",
        text: "Participating in a game jam is one of the most exciting ways to test your game dev skills. With LLM coding models, you can produce a completed, playable browser game in just a single weekend. Here is our recommended blueprint to successfully build and publish your game jam project."
      },
      {
        type: "heading",
        text: "Hour 0-4: The constraints and the concept"
      },
      {
        type: "paragraph",
        text: "Read the jam theme carefully. Instead of building a massive, complex project, pick one simple mechanics loop (e.g. bouncing, swinging, rotating, or sliding) and execute it with high visual juice. A simple game that is extremely polished always scores higher than a broken complex simulator."
      },
      {
        type: "heading",
        text: "Hour 4-12: The Prompting Sprint"
      },
      {
        type: "paragraph",
        text: "Do not ask the AI to build the whole game at once. Break it down into testable milestones:"
      },
      {
        type: "list",
        items: [
          "Milestone 1: Get the canvas loaded with a player block and basic physics (gravity, collision, movement).",
          "Milestone 2: Add obstacles and game-state triggers (points, death, level resets).",
          "Milestone 3: Implement sound effects (using Web Audio API synthesizers so you don't need external audio asset dependencies).",
          "Milestone 4: Add retro pixel animations, particle effects, and screen shake (the 'juice')."
        ]
      },
      {
        type: "heading",
        text: "Hour 12-24: Add Audio Juice via Code"
      },
      {
        type: "paragraph",
        text: "Instead of searching for licensing-free audio files, ask your AI builder to generate retro sound effects natively using the Web Audio API. This keeps your build lightweight and self-contained:"
      },
      {
        type: "code",
        language: "javascript",
        code: `// Generate retro arcade jump sound
function playJumpSound() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.type = "square";
  osc.frequency.setValueAtTime(150, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.15);

  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.15);
}`
      },
      {
        type: "heading",
        text: "Hour 24-48: Polish, Build, and Submit"
      },
      {
        type: "paragraph",
        text: "Double-check your game on mobile devices, wrap your build into a single `.zip` file containing your assets and `index.html` at the root, and upload it directly to VibeGames.Ninja using the Creator Console. Share your submission link in the jam community to invite rating feedback!"
      }
    ]
  }
];

export function getBlogPosts() {
  return BLOG_POSTS;
}

export function getBlogPostBySlug(slug: string) {
  return BLOG_POSTS.find((post) => post.slug === slug) || null;
}
