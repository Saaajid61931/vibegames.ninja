"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Plus, User, Menu, X } from "lucide-react"
import { NinjaConsole } from "@/components/icons/ninja-console"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!session?.user?.id) {
      return
    }

    let active = true

    const loadUnreadCount = async () => {
      try {
        const res = await fetch("/api/notifications/unread", { cache: "no-store" })
        if (!res.ok) {
          return
        }

        const data = await res.json()
        if (active) {
          setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : 0)
        }
      } catch {
        // Non-blocking header data.
      }
    }

    const handleFocus = () => {
      void loadUnreadCount()
    }

    void loadUnreadCount()
    window.addEventListener("focus", handleFocus)

    return () => {
      active = false
      window.removeEventListener("focus", handleFocus)
    }
  }, [session?.user?.id, pathname])

  const displayedUnreadCount = session?.user?.id
    ? (pathname.startsWith("/notifications") ? 0 : unreadCount)
    : 0

  const unreadLabel = displayedUnreadCount > 99 ? "99+" : String(displayedUnreadCount)

  const navigation = [
    { name: "PLAY", href: "/games" },
    { name: "JAMS", href: "/jams" },
    ...(session?.user ? [{ name: "NOTIFS", href: "/notifications", badge: displayedUnreadCount }] : []),
    ...(session?.user ? [{ name: "FAVES", href: "/favorites" }] : []),
    { name: "UPLOAD", href: "/upload" },
    { name: "CREATOR", href: "/creator" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--color-border)]">
      {/* Marquee Banner - single line, no wrap */}
      <div className="bg-[var(--color-primary)] overflow-hidden whitespace-nowrap">
        <div className="marquee-content">
          NEW GAMES DAILY &bull; AI ARCADE &bull; GAME JAMS &bull; BUILD &bull; PLAY &bull; GET INSPIRED &bull; NEW GAMES DAILY &bull; AI ARCADE &bull; GAME JAMS &bull; BUILD &bull; PLAY &bull; GET INSPIRED &bull;
        </div>
      </div>
      
      <div className="bg-[var(--color-base)]">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <NinjaConsole className="h-6 w-6" />
              <span className="font-pixel text-xs tracking-tight">
                <span className="text-[var(--color-primary)]">VIBE</span>
                <span className="text-[var(--color-text)]">GAMES</span>
                <span className="text-[var(--color-text-secondary)]">.NINJA</span>
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
                    {item.badge ? (
                      <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-[#ff0040] px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {unreadLabel}
                      </span>
                    ) : null}
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
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2 border-[var(--color-border)] bg-[var(--color-surface)]">
                          <User className="h-4 w-4 text-[var(--color-primary)]" />
                          <span className="hidden sm:inline">
                            {session.user.username || "Account"}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{session.user.name || session.user.username}</p>
                            <p className="text-xs leading-none text-muted-foreground opacity-70">{session.user.email}</p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/notifications" className="flex w-full items-center justify-between gap-2">
                            <span>Notifications</span>
                            {displayedUnreadCount > 0 ? (
                              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#ff0040] px-1.5 py-0.5 text-[10px] font-bold text-white">
                                {unreadLabel}
                              </span>
                            ) : null}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/creator">Dashboard</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/favorites">Favorites</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-[var(--color-danger)] focus:text-[var(--color-danger)]" onClick={() => signOut()}>
                          Sign out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block px-3 py-2 rounded-md text-sm font-medium ${
                        isActive
                          ? "bg-[var(--color-primary)] text-white"
                          : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]"
                      }`}
                    >
                      <span>{item.name}</span>
                      {item.badge ? (
                        <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-[#ff0040] px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {unreadLabel}
                        </span>
                      ) : null}
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
                  <div className="grid grid-cols-3 gap-2">
                    <Link href="/notifications">
                      <Button variant="outline" className="w-full gap-1" onClick={() => setMobileMenuOpen(false)}>
                        Notifs
                        {displayedUnreadCount > 0 ? (
                          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#ff0040] px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {unreadLabel}
                          </span>
                        ) : null}
                      </Button>
                    </Link>
                    <Link href="/upload">
                      <Button className="w-full" onClick={() => setMobileMenuOpen(false)}>Upload</Button>
                    </Link>
                    <Link href="/creator">
                      <Button variant="outline" className="w-full" onClick={() => setMobileMenuOpen(false)}>Dashboard</Button>
                    </Link>
                  </div>
                  <Link href="/favorites">
                    <Button variant="outline" className="w-full" onClick={() => setMobileMenuOpen(false)}>Favorites</Button>
                  </Link>
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
