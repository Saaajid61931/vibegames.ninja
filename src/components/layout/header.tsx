"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Plus, User, Menu, X, Gamepad2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function Header() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const navigation = [
    { name: "PLAY", href: "/games" },
    { name: "UPLOAD", href: "/upload" },
    { name: "CREATOR", href: "/creator" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--color-border)]">
      {/* Marquee Banner - single line, no wrap */}
      <div className="bg-[var(--color-primary)] overflow-hidden whitespace-nowrap">
        <div className="marquee-content">
          NEW GAMES DAILY &bull; AI ARCADE &bull; BUILD &bull; PUBLISH &bull; PLAY &bull; NEW GAMES DAILY &bull; AI ARCADE &bull; BUILD &bull; PUBLISH &bull; PLAY &bull;
        </div>
      </div>
      
      <div className="bg-[var(--color-base)]">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <Gamepad2 className="h-6 w-6 text-[var(--color-primary)] group-hover:text-[var(--color-arcade-yellow)] transition-colors" />
              <span className="font-pixel text-xs tracking-tight">
                <span className="text-[var(--color-primary)]">VIBE</span>
                <span className="text-[var(--color-text)]">GAMES</span>
                <span className="text-[var(--color-text-secondary)]">.AI</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-2 text-xs font-medium rounded-md transition-all ${
                      isActive
                        ? "bg-[var(--color-primary)] text-white"
                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]"
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {status === "loading" ? (
                <div className="h-9 w-20 bg-[var(--color-surface)] animate-pulse rounded-md" />
              ) : session?.user ? (
                <>
                  <Link href="/upload" className="md:hidden">
                    <Button size="icon" aria-label="Upload game" className="h-10 w-10">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </Link>

                  <div className="hidden md:flex items-center gap-2">
                    <Link href="/upload">
                      <Button size="sm" className="gap-1">
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Upload</span>
                      </Button>
                    </Link>
                    <div className="relative group">
                      <button className="flex items-center gap-2 px-3 py-2 rounded-md border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors bg-[var(--color-surface)]">
                        <User className="h-4 w-4 text-[var(--color-primary)]" />
                        <span className="text-xs font-medium text-[var(--color-text)] hidden sm:inline">
                          {session.user.username || "Account"}
                        </span>
                      </button>
                      <div className="absolute right-0 mt-2 w-48 py-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                        <div className="px-3 py-2 border-b border-[var(--color-border)]">
                          <p className="text-xs font-medium text-[var(--color-text)]">
                            {session.user.name || session.user.username || "Player"}
                          </p>
                          <p className="text-xs text-[var(--color-text-tertiary)]">
                            {session.user.email}
                          </p>
                        </div>
                        <Link
                          href="/creator"
                          className="block px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
                        >
                          Dashboard
                        </Link>
                        <button
                          onClick={() => signOut()}
                          className="block w-full text-left px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] hover:bg-[var(--color-surface-2)]"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-[var(--color-text)] rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface)]"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-[var(--color-border)] space-y-4">
              <nav className="space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`block px-3 py-2 rounded-md text-sm font-medium ${
                        isActive
                          ? "bg-[var(--color-primary)] text-white"
                          : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]"
                      }`}
                    >
                      {item.name}
                    </Link>
                  )
                })}
              </nav>

              {session?.user ? (
                <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
                  <div className="px-1">
                    <p className="text-sm font-medium text-[var(--color-text)]">
                      {session.user.name || session.user.username || "Player"}
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)] truncate">{session.user.email}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/upload">
                      <Button className="w-full">Upload</Button>
                    </Link>
                    <Link href="/creator">
                      <Button variant="outline" className="w-full">Dashboard</Button>
                    </Link>
                  </div>
                  <Button variant="ghost" className="w-full" onClick={() => signOut()}>
                    Sign out
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 border-t border-[var(--color-border)] pt-4">
                  <Link href="/login">
                    <Button variant="outline" className="w-full">Sign in</Button>
                  </Link>
                  <Link href="/register">
                    <Button className="w-full">Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
