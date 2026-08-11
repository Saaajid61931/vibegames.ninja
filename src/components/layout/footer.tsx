import Link from "next/link"
import { Github, Heart, Twitter } from "lucide-react"
import { NinjaConsole } from "@/components/icons/ninja-console"

interface FooterProps {
  prefetchLinks?: boolean
}

export function Footer({ prefetchLinks = true }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-surface">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" prefetch={prefetchLinks ? undefined : false} className="mb-4 flex items-center gap-2">
              <NinjaConsole className="h-6 w-6" />
              <span className="font-sans text-xs font-bold uppercase tracking-widest">
                <span className="text-primary-text">VIBE</span>
                <span className="text-text">GAMES</span>
              </span>
            </Link>
            <p className="mb-4 text-sm text-text-secondary">
              A community for AI-made games. Build, play, and get inspired.
            </p>
            <div className="flex gap-2">
              <a
                href="https://github.com/Saaajid61931/vibegames.ninja"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="VibeGames on GitHub"
                className="rounded-md border border-border p-2 text-text-secondary transition-colors hover:border-border-strong hover:text-text"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com/vibegamesai"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="VibeGames on Twitter"
                className="rounded-md border border-border p-2 text-text-secondary transition-colors hover:border-primary hover:text-primary-text"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-text">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/games"
                  prefetch={prefetchLinks ? undefined : false}
                  className="text-sm text-text-secondary transition-colors hover:text-text"
                >
                  Browse Games
                </Link>
              </li>
              <li>
                <Link
                  href="/games?mobile=true"
                  prefetch={prefetchLinks ? undefined : false}
                  className="text-sm text-text-secondary transition-colors hover:text-text"
                >
                  Mobile Games
                </Link>
              </li>
              <li>
                <Link
                  href="/upload"
                  prefetch={false}
                  className="text-sm text-text-secondary transition-colors hover:text-text"
                >
                  Upload Game
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-text">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/creator"
                  prefetch={prefetchLinks ? undefined : false}
                  className="text-sm text-text-secondary transition-colors hover:text-text"
                >
                  Creator Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/games?sort=popular"
                  prefetch={prefetchLinks ? undefined : false}
                  className="text-sm text-text-secondary transition-colors hover:text-text"
                >
                  Popular Games
                </Link>
              </li>
              <li>
                <Link
                  href="/games?editor=true"
                  prefetch={prefetchLinks ? undefined : false}
                  className="text-sm text-text-secondary transition-colors hover:text-text"
                >
                  Level Editor Games
                </Link>
              </li>
              <li>
                <Link
                  href="/jams"
                  prefetch={prefetchLinks ? undefined : false}
                  className="text-sm text-text-secondary transition-colors hover:text-text"
                >
                  Active Jams
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-text">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/terms"
                  prefetch={prefetchLinks ? undefined : false}
                  className="text-sm text-text-secondary transition-colors hover:text-text"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  prefetch={prefetchLinks ? undefined : false}
                  className="text-sm text-text-secondary transition-colors hover:text-text"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-xs text-text-tertiary">
            Copyright {currentYear} VibeGames.Ninja. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-text-tertiary">
            <span className="text-xs">Made with</span>
            <Heart className="h-3 w-3 text-arcade-red" />
            <span className="text-xs">and AI</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
