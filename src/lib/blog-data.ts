// Intentional static editorial source. Moving the blog to the database is out of
// scope until authoring, review, and migration requirements justify that work.
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
      }
    ]
  },
  {
    id: "post-4",
    slug: "ai-system-prompt-code-refactoring",
    title: "AI Productivity: System Prompts for Code Refactoring",
    excerpt: "Learn how to configure role-based constraints and strict syntax rules to prevent LLMs from truncating code or breaking core logic during massive refactors.",
    category: "TIPS_AND_TRICKS",
    author: "Vibe Dev",
    date: "June 2, 2026",
    readTime: "5 min read",
    coverImage: "/Images/blog/refactor-prompt.png",
    tags: ["Productivity", "Prompting", "Refactoring"],
    content: [
      {
        type: "paragraph",
        text: "One of the most frustrating aspects of using LLMs for code refactoring is the tendency of models to output placeholders like `// ... rest of code stays the same ...` or silently delete edge-case helper functions. To protect your code integrity, you must enforce a strict refactoring system prompt."
      },
      {
        type: "heading",
        text: "The 'Strict Refactoring' System Prompt Template"
      },
      {
        type: "paragraph",
        text: "Copy and paste this configuration block into your system prompt or custom instructions before initiating a refactoring query. It sets absolute parameters on output formatting and logical preservation:"
      },
      {
        type: "code",
        language: "text",
        code: `You are an expert refactoring engine. Your goal is to improve the readability, modularity, and performance of the code provided while strictly preserving all existing behavior.
CRITICAL INSTRUCTIONS:
1. DO NOT use placeholder comments (e.g., '// rest of code here' or '/* unchanged code */'). Write out the file in full.
2. DO NOT delete, alter, or ignore any existing error-handling blocks, console warnings, comments, or boundary checks unless explicitly requested.
3. If you make modifications, explain the architectural reason for the change in a brief markdown summary at the end.`
      },
      {
        type: "heading",
        text: "Why Full File Outputs Matter"
      },
      {
        type: "paragraph",
        text: "While writing full files consumes more tokens, it prevents copy-paste synchronization errors where an AI-generated chunk conflicts with the surrounding scope. Insisting on full files forces the model to verify all imported modules and variable declarations remain valid in context."
      }
    ]
  },
  {
    id: "post-5",
    slug: "state-of-ai-2026-agentic-workspaces",
    title: "State of AI 2026: The Rise of Agentic Workspaces",
    excerpt: "An overview of how modern code editors and LLM APIs are shifting from chat completions to autonomous file editing, terminal integration, and sandboxed previews.",
    category: "AI_UPDATES",
    author: "Vibe Dev",
    date: "June 5, 2026",
    readTime: "7 min read",
    coverImage: "/Images/blog/agentic-workspaces.png",
    tags: ["AI Trends", "Agentic AI", "Code Editors"],
    content: [
      {
        type: "paragraph",
        text: "The landscape of AI-assisted engineering has undergone a massive paradigm shift in 2026. The era of passive chat interfaces is ending. Developers are embracing 'Agentic Workspaces'—autonomous environments where LLMs don't just recommend code, but directly modify files, execute terminal scripts, test builds, and inspect sandboxed live previews."
      },
      {
        type: "heading",
        text: "From Chatbots to Autonomous Co-Pilots"
      },
      {
        type: "paragraph",
        text: "Earlier AI coding helpers operated in isolation: you copied code out of a browser chatbox and manually pasted it into your IDE. Today, editors like Cursor, Windsurf, and custom platform integrations read your workspace state, invoke command terminals, and edit files in place. The human developer's role is shifting from code author to system architect and code reviewer."
      },
      {
        type: "heading",
        text: "The Architectural Core of Agentic Workspaces"
      },
      {
        type: "list",
        items: [
          "File system state tracking (LLMs reading index, logs, and relative dependencies).",
          "Sandbox build validation (executing 'npm run build' or compiler tests automatically).",
          "Automated loop detection (detecting and self-correcting linting and type errors).",
          "Secure execution bounds (sandboxing terminal commands to avoid directory pollution)."
        ]
      },
      {
        type: "heading",
        text: "What This Means for Junior Devs"
      },
      {
        type: "paragraph",
        text: "As code writing becomes fully automated, the most valuable skills are reading code quickly, understanding design patterns, and debugging systems. The ability to express logical goals clearly in natural language—supported by concrete technical constraints—is the core programming capability of 2026."
      }
    ]
  },
  {
    id: "post-6",
    slug: "llm-level-design-procedural",
    title: "LLMs for Level Design: Procedural Generation Prompts",
    excerpt: "How to prompt AI models to output structured JSON representations of levels, obstacle layouts, and enemy spawn coordinates that load cleanly into game engines.",
    category: "TIPS_AND_TRICKS",
    author: "Vibe Dev",
    date: "June 10, 2026",
    readTime: "5 min read",
    coverImage: "/Images/blog/level-design-json.png",
    tags: ["Level Design", "Procedural", "JSON"],
    content: [
      {
        type: "paragraph",
        text: "Generating game stages procedurally often leads to repetitive layouts. By combining your game's parser with structured JSON output from an LLM, you can create highly creative level design generators. Here is how to prompt AI to generate valid, play-tested game map configurations."
      },
      {
        type: "heading",
        text: "1. Define the Map Schema"
      },
      {
        type: "paragraph",
        text: "Before prompting the AI, define a strict, compact JSON schema for your map tiles. This keeps parsing simple and prevents the model from generating random, unsupported object keys:"
      },
      {
        type: "code",
        language: "json",
        code: `{
  "gridWidth": 16,
  "gridHeight": 9,
  "tiles": [0,0,1,1,0,0], // 0: empty, 1: block, 2: hazard
  "entities": [
    { "type": "player_start", "x": 1, "y": 2 },
    { "type": "enemy_patrol", "x": 8, "y": 5, "range": 3 },
    { "type": "goal", "x": 14, "y": 2 }
  ]
}`
      },
      {
        type: "heading",
        text: "2. The Structured Prompt Hook"
      },
      {
        type: "paragraph",
        text: "Use this system instruction to ensure the AI always outputs parseable JSON, keeps the level beatable, and avoids markdown wrapping comments:"
      },
      {
        type: "code",
        language: "text",
        code: `You are a professional game level designer. Generate a map layout strictly adhering to the JSON schema provided.
CRITICAL RULES:
1. Return ONLY the raw JSON string inside a markdown code block. Do NOT write conversational explanations.
2. Ensure there is always a valid, unblocked path from the player_start to the goal tile.
3. Balance the map: do not group more than 3 hazards next to each other.`
      }
    ]
  },
  {
    id: "post-7",
    slug: "web-audio-synth-effects-ai",
    title: "Web Audio Synths: Simple Synth Designs for AI Code",
    excerpt: "A developer's cheatsheet for prompting AI coding models to generate laser sounds, coin collections, explosions, and retro background music loops.",
    category: "TIPS_AND_TRICKS",
    author: "Vibe Dev",
    date: "June 15, 2026",
    readTime: "5 min read",
    coverImage: "/Images/blog/audio-synth.png",
    tags: ["Web Audio", "Synth", "Game Audio"],
    content: [
      {
        type: "paragraph",
        text: "Finding, converting, and uploading `.mp3` or `.wav` assets for your browser games is slow. Using the Web Audio API, your game can generate authentic 8-bit sound effects directly via browser code. Here are the core formulas to feed your AI builder to generate classic synth audio effects."
      },
      {
        type: "heading",
        text: "1. The Retro Coin Collect Sound"
      },
      {
        type: "paragraph",
        text: "Classic retro coins use two quick frequencies: a base note followed instantly by a higher fifth. Prompt the AI to use this double-tone ramp oscillator setup:"
      },
      {
        type: "code",
        language: "javascript",
        code: `function playCoinSound() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "sine";
  osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
  osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5

  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

  osc.start();
  osc.stop(ctx.currentTime + 0.35);
}`
      },
      {
        type: "heading",
        text: "2. The Retro Explosion / Noise Sound"
      },
      {
        type: "paragraph",
        text: "Explosions require noise. Instead of clean sine waves, generate a buffer filled with random values (white noise), feed it through a low-pass band filter, and ramp down the volume:"
      },
      {
        type: "code",
        language: "javascript",
        code: `function playExplosionSound() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const bufferSize = ctx.sampleRate * 0.4; // 0.4 seconds
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1; // White noise
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(800, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.4);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start();
  noise.stop(ctx.currentTime + 0.4);
}`
      }
    ]
  },
  {
    id: "post-8",
    slug: "safely-embedding-untrusted-code-iframes",
    title: "AI Sandbox: Safely Embedding Sandbox Code in Iframes",
    excerpt: "Best practices for configuring the HTML5 sandbox attribute, window postMessage communication, and origin boundaries when running AI-generated scripts.",
    category: "DEVLOGS",
    author: "Vibe Dev",
    date: "June 20, 2026",
    readTime: "6 min read",
    coverImage: "/Images/blog/sandbox-iframe.png",
    tags: ["Security", "Iframes", "Sandboxing"],
    content: [
      {
        type: "paragraph",
        text: "Running user-submitted, AI-generated games inside your Next.js application poses severe security risks. A rogue script could access session cookies, execute cross-site scripting (XSS) actions, or compromise authentication state. The ultimate shield is a properly sandboxed HTML5 iframe."
      },
      {
        type: "heading",
        text: "1. The Secure Sandbox Attribute Set"
      },
      {
        type: "paragraph",
        text: "When embedding game frames, restrict permissions using the `sandbox` attribute. By omitting `allow-same-origin`, the embedded frame is treated as a unique origin, blocking it from accessing parent local storage or document models:"
      },
      {
        type: "code",
        language: "html",
        code: `<iframe
  src="/embed/game-folder"
  sandbox="allow-scripts allow-pointer-lock"
  scrolling="no"
  class="w-full h-full border-none"
  title="VibeGames Sandbox Embed"
></iframe>`
      },
      {
        type: "heading",
        text: "2. Secure Communication via postMessage"
      },
      {
        type: "paragraph",
        text: "Since the frame and parent live on separate origins, communicate exclusively via structured postMessages. Always validate the origin and source payload structure before handling messages in your wrapper page:"
      },
      {
        type: "code",
        language: "javascript",
        code: `// Parent Window Event Handler
window.addEventListener("message", (event) => {
  // 1. Verify expected structure
  const data = event.data;
  if (!data || data.source !== "vibegames-sdk") return;

  // 2. Route payload based on message type
  switch (data.type) {
    case "VG_SUBMIT_SCORE":
      savePlayerScore(data.payload.score);
      break;
    default:
      console.warn("Unhandled frame action", data.type);
  }
});`
      }
    ]
  },
  {
    id: "post-9",
    slug: "prompting-ai-css-layouts-palettes",
    title: "AI UI Design: Prompting for CSS Layouts & Palettes",
    excerpt: "Essential prompt templates to get LLMs to design glowing cyber aesthetics, glassmorphism, responsive grids, and harmonious retro color palettes.",
    category: "TIPS_AND_TRICKS",
    author: "Vibe Dev",
    date: "June 24, 2026",
    readTime: "5 min read",
    coverImage: "/Images/blog/css-palette.png",
    tags: ["CSS", "Web Design", "Prompting"],
    content: [
      {
        type: "paragraph",
        text: "Getting AI to write layout CSS often results in generic, white-and-gray grids. To force the AI to design modern, high-contrast, visually stunning pages (like glassmorphism dashboards, neon cyber cards, or pixel retro buttons), you must feed it pre-defined CSS design tokens in your prompting template."
      },
      {
        type: "heading",
        text: "1. The HSL Theme Token Prompt"
      },
      {
        type: "paragraph",
        text: "AI models struggle with color hex codes, but handle HSL color systems easily. Instruct the AI to structure colors around a dark-mode HSL configuration. This allows it to generate beautiful, glowing accents naturally:"
      },
      {
        type: "code",
        language: "text",
        code: `Structure the styling around this dark-theme CSS variable design system:
:root {
  --color-canvas: #0d0d15;       /* deep space black */
  --color-surface: #11111d;    /* card panel background */
  --color-primary: #ffff00;    /* neon yellow accent */
  --color-secondary: #00ff40;  /* neon green success */
  --color-border: #4a4a6a;     /* retro card outline */
}
Use these tokens for all custom components (buttons, panels, borders).`
      },
      {
        type: "heading",
        text: "2. The Glowing Arcade Card Hook"
      },
      {
        type: "paragraph",
        text: "To get the AI to generate a premium glowing border card instead of standard rounded gray panels, add this direct instruction to the prompt:"
      },
      {
        type: "code",
        language: "css",
        code: `.arcade-card {
  background-color: var(--color-surface);
  border: 3px solid var(--color-border);
  box-shadow: 4px 4px 0px var(--color-border);
  transition: all 0.2s ease-in-out;
}
.arcade-card:hover {
  border-color: var(--color-primary);
  box-shadow: 4px 4px 0px var(--color-primary);
  transform: translate(-2px, -2px);
}`
      }
    ]
  },
  {
    id: "post-10",
    slug: "debugging-ai-spaghetti-codeblocks",
    title: "Debugging Spaghetti: Prompting for Massive Codeblocks",
    excerpt: "Tactical prompts and strategies to feed an LLM when it gets confused by circular references, variable scope leakage, and huge single-file scripts.",
    category: "DEVLOGS",
    author: "Vibe Dev",
    date: "June 28, 2026",
    readTime: "6 min read",
    coverImage: "/Images/blog/spaghetti-debug.png",
    tags: ["Debugging", "Refactoring", "Troubleshooting"],
    content: [
      {
        type: "paragraph",
        text: "As your AI-generated game grows in features, single-file scripts easily bloat to over 1000 lines. At this size, prompt memory limits degrade and the LLM begins introducing circular scope dependencies, coordinate reference errors, or duplicate loops. Here is a battle-tested strategy to debug and segment massive AI-made spaghetti codeblocks."
      },
      {
        type: "heading",
        text: "1. The 'Dependency Mapping' Prompt"
      },
      {
        type: "paragraph",
        text: "Before asking the AI to fix a bug in a massive file, force it to map the logical blocks. This aligns the context window and forces it to locate where variables are declared versus modified:"
      },
      {
        type: "code",
        language: "text",
        code: `Read the attached file and construct a text-based map showing:
1. Global variables and where they are declared.
2. The core update / render loop hooks.
3. Every custom function name, its arguments, and what global variables it reads or modifies.
Do not modify the code yet; output the dependency map first.`
      },
      {
        type: "heading",
        text: "2. The Modularity Split Protocol"
      },
      {
        type: "paragraph",
        text: "Once the map is drawn, ask the model to split the code into separate, independent scripts. For browser games, segment files into: `input.js` (keyboard/touch), `physics.js` (movement/collision), `audio.js` (synths), and `game.js` (central loop and state controller). This modular design prevents context leakage and keeps AI prompting tight and maintainable."
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
