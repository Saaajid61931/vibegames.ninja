import Link from "next/link"
import { ArrowUpRight, Github, Heart, Twitter } from "lucide-react"
import { NinjaConsole } from "@/components/icons/ninja-console"

interface FooterProps {
  prefetchLinks?: boolean
}

const FOOTER_GROUPS = [
  {
    title: "Explore",
    links: [
      { href: "/games", label: "All games" },
      { href: "/games?mobile=true", label: "Mobile games" },
      { href: "/games?sort=popular", label: "Most loved" },
      { href: "/collections", label: "Collections" },
      { href: "/community", label: "Community" },
    ],
  },
  {
    title: "Create",
    links: [
      { href: "/upload", label: "Publish a game" },
      { href: "/creator", label: "Creator dashboard" },
      { href: "/library", label: "Source library" },
      { href: "/creator/projects", label: "Stories & source" },
      { href: "/games?editor=true", label: "Level editors" },
      { href: "/jams", label: "Game jams" },
    ],
  },
] as const

export function Footer({ prefetchLinks = false }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border-strong bg-surface">
      <div className="container mx-auto px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-8 sm:pt-12">
        <div className="mb-9 flex flex-col items-start justify-between gap-5 border border-border-strong bg-canvas px-5 py-6 shadow-[4px_4px_0_#05070d] sm:flex-row sm:items-center sm:px-7">
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-arcade-cyan">Your next level starts here</p>
            <h2 className="heading-pixel-sm text-text">Got a game in you?</h2>
            <p className="mt-2 text-sm text-text-secondary">Put it in the arcade. Find your players.</p>
          </div>
          <Link href="/upload" prefetch={false} className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-3 border border-arcade-yellow bg-arcade-yellow px-5 text-xs font-bold uppercase tracking-widest text-canvas shadow-[3px_3px_0_#05070d] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-arcade-cyan sm:w-auto">
            Publish your game <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-[2fr_1fr_1fr] lg:gap-12">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" prefetch={prefetchLinks ? undefined : false} className="inline-flex min-h-11 items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arcade-cyan">
              <span className="flex h-10 w-10 items-center justify-center border border-arcade-cyan/40 bg-arcade-cyan/5"><NinjaConsole className="h-7 w-7" /></span>
              <span className="heading-pixel-sm"><span className="text-arcade-cyan">VIBE</span><span className="text-text">GAMES</span></span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-text-secondary">Small games. Big ideas. An arcade for AI-made games and the people who make them.</p>
            <div className="mt-4 flex gap-2">
              <a href="https://github.com/Saaajid61931/vibegames.ninja" target="_blank" rel="noopener noreferrer" aria-label="VibeGames on GitHub (opens in a new tab)" className="flex h-11 w-11 items-center justify-center border border-border-strong text-text-secondary transition-colors hover:border-arcade-cyan hover:text-arcade-cyan focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arcade-cyan"><Github className="h-4 w-4" aria-hidden="true" /></a>
              <a href="https://twitter.com/vibegamesai" target="_blank" rel="noopener noreferrer" aria-label="VibeGames on Twitter (opens in a new tab)" className="flex h-11 w-11 items-center justify-center border border-border-strong text-text-secondary transition-colors hover:border-arcade-cyan hover:text-arcade-cyan focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arcade-cyan"><Twitter className="h-4 w-4" aria-hidden="true" /></a>
            </div>
          </div>

          {FOOTER_GROUPS.map((group, index) => (
            <nav key={group.title} aria-label={`${group.title} footer links`}>
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text"><span className="text-[10px] text-arcade-cyan">0{index + 1}</span>{group.title}</h3>
              <ul>
                {group.links.map((link) => (
                  <li key={link.href}><Link href={link.href} prefetch={prefetchLinks ? undefined : false} className="inline-flex min-h-10 items-center text-sm text-text-secondary transition-colors hover:text-arcade-cyan focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arcade-cyan">{link.label}</Link></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-border pt-5 text-xs text-text-secondary sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p>© {currentYear} VibeGames.Ninja</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/terms" prefetch={false} className="inline-flex min-h-10 items-center hover:text-arcade-cyan">Terms of service</Link>
            <Link href="/privacy" prefetch={false} className="inline-flex min-h-10 items-center hover:text-arcade-cyan">Privacy policy</Link>
            <span className="inline-flex items-center gap-1.5">Made with <Heart className="h-3 w-3 text-arcade-red" aria-label="love" /> and AI</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
