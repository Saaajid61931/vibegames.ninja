"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Bell, Heart, LayoutDashboard, Plus, User, Menu, Search, Settings, X } from "lucide-react"
import { NinjaConsole } from "@/components/icons/ninja-console"
import { NotificationsMenu } from "@/components/layout/notifications-menu"
import { Button } from "@/components/ui/button"
import { useEffect, useRef, useState } from "react"
import { useNotificationFeed } from "@/hooks/use-notification-feed"
import { MAX_DISCOVERY_SEARCH_LENGTH } from "@/lib/discovery-query"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HeaderProps {
  prefetchLinks?: boolean
}

export function Header({ prefetchLinks = true }: HeaderProps) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [marqueeVisible, setMarqueeVisible] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)
  const { unreadCount, notifications, loading, refresh } = useNotificationFeed(session?.user?.id, pathname)

  useEffect(() => {
    let shouldShowMarquee = true

    try {
      shouldShowMarquee = window.sessionStorage.getItem("vg-marquee-dismissed") !== "true"
    } catch {
      // Keep the announcement visible when storage is unavailable.
    }

    const frameId = window.requestAnimationFrame(() => setMarqueeVisible(shouldShowMarquee))
    return () => window.cancelAnimationFrame(frameId)
  }, [])

  useEffect(() => {
    if (!mobileMenuOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    const closeForDesktop = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false)
        mobileMenuButtonRef.current?.focus()
      }
    }

    document.body.style.overflow = "hidden"
    window.addEventListener("resize", closeForDesktop)
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("resize", closeForDesktop)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [mobileMenuOpen])

  const displayedUnreadCount = session?.user?.id
    ? (pathname.startsWith("/notifications") ? 0 : unreadCount)
    : 0

  const unreadLabel = displayedUnreadCount > 99 ? "99+" : String(displayedUnreadCount)

  const navigation = [
    { name: "PLAY", href: "/games" },
    { name: "JAMS", href: "/jams" },
    { name: "BLOG", href: "/blog" },
    ...(session?.user ? [{ name: "FAVS", href: "/favorites" }] : []),
    { name: "UPLOAD", href: "/upload" },
    { name: "CREATOR", href: "/creator" },
  ]

  const isNavigationActive = (href: string) => {
    if (href === "/games") {
      return pathname.startsWith("/games") || pathname.startsWith("/play/")
    }

    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = searchQuery.trim()
    router.push(query ? `/games?q=${encodeURIComponent(query)}` : "/games")
    setMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full max-w-full overflow-x-clip border-b border-border pt-[env(safe-area-inset-top)]">
      {/* Hide a previously dismissed announcement before first paint to avoid a layout jump. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            'try{if(window.sessionStorage.getItem("vg-marquee-dismissed")==="true"){document.documentElement.setAttribute("data-marquee-dismissed","")}}catch(e){}',
        }}
      />
      {marqueeVisible ? (
        <div className="vg-marquee relative overflow-hidden whitespace-nowrap bg-primary pr-11">
          <div className="marquee-content">
            NEW GAMES DAILY &bull; AI ARCADE &bull; GAME JAMS &bull; BUILD &bull; PLAY &bull; GET INSPIRED &bull; NEW GAMES DAILY &bull; AI ARCADE &bull; GAME JAMS &bull; BUILD &bull; PLAY &bull; GET INSPIRED &bull;
          </div>
          <button
            type="button"
            className="absolute inset-y-0 right-0 grid w-11 place-items-center bg-primary text-white transition-colors hover:bg-primary-hover"
            aria-label="Dismiss announcement"
            onClick={() => {
              setMarqueeVisible(false)
              try {
                window.sessionStorage.setItem("vg-marquee-dismissed", "true")
              } catch {
                // The dismissal remains active for this render when storage is unavailable.
              }
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
      
      <div className="bg-canvas">
        <div className="container mx-auto min-w-0 px-4">
          <div className="flex h-14 min-w-0 items-center justify-between gap-2">
            {/* Logo */}
            <Link href="/" prefetch={prefetchLinks ? undefined : false} className="group flex min-w-0 items-center gap-2">
              <NinjaConsole className="h-6 w-6 shrink-0" />
              <span className="truncate font-sans text-xs font-bold uppercase tracking-widest">
                <span className="text-primary-text">VIBE</span>
                <span className="text-text">GAMES</span>
                <span className="text-text-secondary">.NINJA</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = isNavigationActive(item.href)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    prefetch={item.href === "/upload" ? false : (prefetchLinks ? undefined : false)}
                    className={`px-3 py-2 text-xs font-medium rounded-md transition-all ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-text-secondary hover:text-text hover:bg-surface"
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            <form onSubmit={submitSearch} role="search" className="relative mx-2 hidden w-44 lg:block xl:w-56">
              <label htmlFor="global-game-search" className="sr-only">Search games</label>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
              <input
                id="global-game-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                maxLength={MAX_DISCOVERY_SEARCH_LENGTH}
                placeholder="Search games"
                className="h-9 w-full border-2 border-border-strong bg-surface pl-9 pr-9 text-xs text-text placeholder:text-text-secondary focus:border-arcade-yellow focus:outline-none"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 grid h-9 w-9 place-items-center text-text-secondary transition-colors hover:text-arcade-yellow"
                aria-label="Submit game search"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>

            {/* Right Section */}
            <div className="flex shrink-0 items-center gap-2">
              {status === "loading" ? (
                null
              ) : session?.user ? (
                <>
                  <Link href="/upload" prefetch={false} className="md:hidden">
                    <Button size="icon" aria-label="Upload game" className="h-11 w-11">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </Link>

                  <div className="hidden md:flex items-center gap-2">
                    <Link href="/upload" prefetch={false}>
                      <Button size="sm" className="gap-1">
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Upload</span>
                      </Button>
                    </Link>

                    <NotificationsMenu
                      pathname={pathname}
                      loading={loading}
                      notifications={notifications}
                      unreadCount={unreadCount}
                      onRefresh={refresh}
                    />
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2 border-border bg-surface">
                          <User className="h-4 w-4 text-primary-text" />
                          <span className="hidden sm:inline">
                            {session.user.name || session.user.username || "Account"}
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
                          <Link href="/creator" prefetch={prefetchLinks ? undefined : false}>Dashboard</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/upload" prefetch={false}>Upload Game</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/jams" prefetch={prefetchLinks ? undefined : false}>Game Jams</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/settings" prefetch={prefetchLinks ? undefined : false}>Settings</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/favorites" prefetch={prefetchLinks ? undefined : false}>Favorites</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild><Link href="/collections" prefetch={false}>Collections</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link href="/community" prefetch={false}>Community</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link href="/library" prefetch={false}>Source library</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link href="/creator/projects" prefetch={false}>Stories & source</Link></DropdownMenuItem>
                        <DropdownMenuItem className="text-danger focus:text-danger" onClick={() => signOut()}>
                          Sign out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link href="/login" prefetch={prefetchLinks ? undefined : false}>
                    <Button variant="ghost" size="sm">
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/register" prefetch={prefetchLinks ? undefined : false}>
                    <Button size="sm">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                ref={mobileMenuButtonRef}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden grid h-11 w-11 place-items-center text-text rounded-md border border-border transition-colors hover:bg-surface"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-navigation-menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div
            id="mobile-navigation-menu"
            inert={!mobileMenuOpen}
            className={`md:hidden overflow-hidden border-t border-border transition-[max-height,opacity] duration-200 ease-out ${
              mobileMenuOpen
                ? "max-h-[calc(100dvh-6rem)] opacity-100"
                : "max-h-0 border-t-0 opacity-0"
            }`}
          >
            <div className="max-h-[calc(100dvh-6rem)] space-y-4 overflow-y-auto overscroll-contain py-4">
              <form onSubmit={submitSearch} role="search" className="relative">
                <label htmlFor="mobile-global-game-search" className="sr-only">Search games</label>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
                <input
                  id="mobile-global-game-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  maxLength={MAX_DISCOVERY_SEARCH_LENGTH}
                  placeholder="Search the arcade"
                  className="h-11 w-full border-2 border-border-strong bg-surface pl-10 pr-12 text-base text-text placeholder:text-text-secondary focus:border-arcade-yellow focus:outline-none"
                />
                <button type="submit" className="absolute right-0 top-0 grid h-11 w-11 place-items-center text-arcade-yellow" aria-label="Submit game search">
                  <Search className="h-4 w-4" />
                </button>
              </form>
              <nav className="space-y-1">
                <Link key="/collections" href="/collections" prefetch={false} onClick={() => setMobileMenuOpen(false)} className="block rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface hover:text-text">Collections</Link>
                <Link key="/community" href="/community" prefetch={false} onClick={() => setMobileMenuOpen(false)} className="block rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface hover:text-text">Community</Link>
                <Link key="/library" href="/library" prefetch={false} onClick={() => setMobileMenuOpen(false)} className="block rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface hover:text-text">Source library</Link>
                <Link key="/creator/projects" href="/creator/projects" prefetch={false} onClick={() => setMobileMenuOpen(false)} className="block rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface hover:text-text">Stories & source</Link>
                {navigation.map((item) => {
                  const isActive = isNavigationActive(item.href)
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      prefetch={item.href === "/upload" ? false : (prefetchLinks ? undefined : false)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex min-h-[44px] items-center rounded-md px-3 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary text-white"
                          : "text-text-secondary hover:text-text hover:bg-surface"
                      }`}
                    >
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </nav>

              {session?.user ? (
                <div className="space-y-3 border-t border-border pt-4">
                  <div className="px-1">
                    <p className="text-sm font-medium text-text">
                      {session.user.name || session.user.username || "Player"}
                    </p>
                    <p className="text-xs text-text-tertiary truncate">{session.user.email}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/notifications" prefetch={prefetchLinks ? undefined : false}>
                      <Button variant="outline" className="h-11 w-full justify-start gap-2" onClick={() => setMobileMenuOpen(false)}>
                        <Bell className="h-4 w-4" />
                        Alerts
                        {displayedUnreadCount > 0 ? (
                          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-arcade-red px-1.5 py-0.5 text-xs font-bold text-white">
                            {unreadLabel}
                          </span>
                        ) : null}
                      </Button>
                    </Link>
                    <Link href="/upload" prefetch={false}>
                      <Button className="h-11 w-full justify-start gap-2" onClick={() => setMobileMenuOpen(false)}>
                        <Plus className="h-4 w-4" />
                        Upload
                      </Button>
                    </Link>
                    <Link href="/creator" prefetch={prefetchLinks ? undefined : false}>
                      <Button variant="outline" className="h-11 w-full justify-start gap-2" onClick={() => setMobileMenuOpen(false)}>
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Button>
                    </Link>
                    <Link href="/favorites" prefetch={prefetchLinks ? undefined : false}>
                      <Button variant="outline" className="h-11 w-full justify-start gap-2" onClick={() => setMobileMenuOpen(false)}>
                        <Heart className="h-4 w-4" />
                        Favorites
                      </Button>
                    </Link>
                    <Link href="/settings" prefetch={prefetchLinks ? undefined : false} className="col-span-2">
                      <Button variant="outline" className="h-11 w-full justify-start gap-2" onClick={() => setMobileMenuOpen(false)}>
                        <Settings className="h-4 w-4" />
                        Settings
                      </Button>
                    </Link>
                  </div>
                  <Button
                    variant="ghost"
                    className="h-11 w-full"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      signOut()
                    }}
                  >
                    Sign out
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 border-t border-border pt-4">
                  <Link href="/login" prefetch={prefetchLinks ? undefined : false}>
                    <Button variant="outline" className="h-11 w-full" onClick={() => setMobileMenuOpen(false)}>Sign in</Button>
                  </Link>
                  <Link href="/register" prefetch={prefetchLinks ? undefined : false}>
                    <Button className="h-11 w-full" onClick={() => setMobileMenuOpen(false)}>Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Keep sticky offsets in sync before first paint (marquee + safe area aware). */}
          <script
            dangerouslySetInnerHTML={{
              __html:
                '(function(){var el=document.currentScript&&document.currentScript.parentElement;if(!el)return;var set=function(){document.documentElement.style.setProperty("--vg-header-height",el.getBoundingClientRect().height+"px")};set();if(typeof ResizeObserver!=="undefined"){new ResizeObserver(set).observe(el)}})()',
            }}
          />
        </div>
      </div>
    </header>
  )
}
