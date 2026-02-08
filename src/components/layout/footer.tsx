import Link from "next/link"
import { Gamepad2, Github, Twitter, Heart } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Gamepad2 className="h-6 w-6 text-[var(--color-primary)]" />
              <span className="font-pixel text-xs">
                <span className="text-[var(--color-primary)]">VIBE</span>
                <span className="text-[var(--color-text)]">GAMES</span>
              </span>
            </Link>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              AI-powered HTML5 game arcade. Build, publish, and play.
            </p>
            <div className="flex gap-2">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 rounded-md border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:border-[var(--color-border-strong)] transition-colors"
              >
                <Github className="h-4 w-4" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-md border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/games" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
                  Browse Games
                </Link>
              </li>
              <li>
                <Link href="/upload" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
                  Upload Game
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/creator" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
                  Creator Dashboard
                </Link>
              </li>
              <li>
                <Link href="/games?sort=popular" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
                  Popular Games
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[var(--color-border)] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[var(--color-text-tertiary)]">
            © {currentYear} VibeGames.ai. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-[var(--color-text-tertiary)]">
            <span className="text-xs">Made with</span>
            <Heart className="h-3 w-3 text-[var(--color-arcade-red)]" />
            <span className="text-xs">and AI</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
