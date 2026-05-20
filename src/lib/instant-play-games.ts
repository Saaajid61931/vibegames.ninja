export type InstantPlayGame = {
  slug: string
  title: string
  href: string
  category: string
  format: string
  description: string
  hook: string
  accent: string
}

export const instantPlayGames: InstantPlayGame[] = [
  {
    slug: "harbor-pilot",
    title: "Harbor Pilot",
    href: "/sample-games/harbor-pilot/index.html",
    category: "Strategy",
    format: "Mouse and touch",
    description: "Guide working boats through tight harbor lanes, collect cargo, and avoid costly collisions.",
    hook: "A calm but tense route-planning game for quick browser sessions.",
    accent: "#38bdf8",
  },
  {
    slug: "orchard-stack",
    title: "Orchard Stack",
    href: "/sample-games/orchard-stack/index.html",
    category: "Puzzle",
    format: "Mobile friendly",
    description: "Drop fruit into tidy stacks, chase combos, and keep the orchard from overflowing.",
    hook: "A one-more-round stacking toy with simple rules and readable touch controls.",
    accent: "#84cc16",
  },
  {
    slug: "switchback-station",
    title: "Switchback Station",
    href: "/sample-games/switchback-station/index.html",
    category: "Puzzle",
    format: "Desktop and tablet",
    description: "Flip rail switches, route trains, and keep a vintage rail yard moving under pressure.",
    hook: "A tactile logic game built around timing, planning, and near misses.",
    accent: "#f59e0b",
  },
  {
    slug: "neon-raycaster",
    title: "Neon Raycaster",
    href: "/sample-games/neon-raycaster/index.html",
    category: "Action",
    format: "Keyboard",
    description: "Explore a glowing maze in first person and survive a compact retro shooter loop.",
    hook: "A fast technical showcase for AI-made 3D-style HTML5 games.",
    accent: "#a855f7",
  },
  {
    slug: "neon-fps",
    title: "Neon FPS",
    href: "/sample-games/neon-fps/index.html",
    category: "Action",
    format: "Keyboard and mouse",
    description: "Run through a neon arena, line up shots, and push for a cleaner score each attempt.",
    hook: "A bite-sized browser FPS for desktop players.",
    accent: "#22d3ee",
  },
  {
    slug: "2048-remix",
    title: "2048 Remix",
    href: "/sample-games/2048-remix/index.html",
    category: "Puzzle",
    format: "Keyboard and touch",
    description: "Slide tiles, merge numbers, and chase a higher board in a clean remix of a classic puzzle.",
    hook: "Instantly understandable, easy to share, and useful for mobile testing.",
    accent: "#facc15",
  },
  {
    slug: "code-clicker",
    title: "Code Clicker",
    href: "/sample-games/code-clicker/index.html",
    category: "Incremental",
    format: "Mouse and touch",
    description: "Click, upgrade, automate, and turn tiny code wins into a growing production line.",
    hook: "A creator-themed idle loop for quick repeat visits.",
    accent: "#fb7185",
  },
  {
    slug: "vibe-coder",
    title: "Vibe Coder",
    href: "/sample-games/vibe-coder/index.html",
    category: "Arcade",
    format: "Keyboard",
    description: "Catch prompts, dodge bugs, and keep the build flowing in a playful coding arcade loop.",
    hook: "An on-brand game that makes the platform itself easier to share.",
    accent: "#34d399",
  },
]

export const featuredInstantPlayGames = instantPlayGames.slice(0, 3)
