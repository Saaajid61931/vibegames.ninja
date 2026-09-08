"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { ArrowRight, Bell, Heart, LayoutDashboard, Plus, User, Menu, Search, Settings, X } from "lucide-react"
import { NinjaConsole } from "@/components/icons/ninja-console"
import { NotificationsMenu } from "@/components/layout/notifications-menu"
import { Button } from "@/components/ui/button"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
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
  const headerRef = useRef<HTMLElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
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

  useLayoutEffect(() => {
    const header = headerRef.current
    if (!header) return
    const updateHeight = () => {
      document.documentElement.style.setProperty("--vg-header-height", `${header.getBoundingClientRect().height}px`)
    }
    updateHeight()
    const observer = new ResizeObserver(updateHeight)
    observer.observe(header)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!mobileMenuOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    const menuTrigger = mobileMenuButtonRef.current
    const closeForDesktop = () => {
      if (window.innerWidth >= 1280) {
        setMobileMenuOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        setMobileMenuOpen(false)
        return
      }
      if (event.key !== "Tab") return
      const controls = mobileMenuRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]'
      )
      if (!controls?.length) return
      const first = controls[0]
      const last = controls[controls.length - 1]
      const outsideMenu = !mobileMenuRef.current?.contains(document.activeElement)
      if (event.shiftKey && (document.activeElement === first || outsideMenu)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || outsideMenu)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.body.style.overflow = "hidden"
    const frameId = window.requestAnimationFrame(() => {
      mobileMenuRef.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true })
    })
    window.addEventListener("resize", closeForDesktop)
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.cancelAnimationFrame(frameId)
      window.removeEventListener("resize", closeForDesktop)
      window.removeEventListener("keydown", handleKeyDown)
      if (window.innerWidth < 1280) menuTrigger?.focus({ preventScroll: true })
    }
  }, [mobileMenuOpen])

  const displayedUnreadCount = session?.user?.id
    ? (pathname.startsWith("/notifications") ? 0 : unreadCount)
    : 0

  const unreadLabel = displayedUnreadCount > 99 ? "99+" : String(displayedUnreadCount)

  const navigation = [
    { name: "EXPLORE", href: "/games" },
    { name: "COLLECTIONS", href: "/collections" },
    { name: "COMMUNITY", href: "/community" },
    { name: "JAMS", href: "/jams" },
    { name: "SHARE A GAME", href: "/upload" },
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
    <header ref={headerRef} className="vg-site-header sticky top-0 z-50 w-full max-w-full border-b border-border-strong bg-canvas pt-[env(safe-area-inset-top)]">
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
            NEW GAMES DAILY &bull; SMALL GAMES. BIG IDEAS. &bull; MADE TO PLAY &bull; BUILT BY YOU &bull; NEW GAMES DAILY &bull; SMALL GAMES. BIG IDEAS. &bull; MADE TO PLAY &bull; BUILT BY YOU &bull;
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
        <div className="container mx-auto min-w-0 px-4 sm:px-6">
          <div className="flex h-[72px] min-w-0 items-center justify-between gap-3 xl:gap-5">
            {/* Logo */}
            <Link href="/" prefetch={prefetchLinks ? undefined : false} className="group flex min-w-0 shrink-0 items-center gap-2.5" aria-label="VibeGames Ninja home">
              <span className="grid h-10 w-10 shrink-0 place-items-center border border-border-strong bg-surface transition-colors group-hover:border-arcade-yellow"><NinjaConsole className="h-7 w-7" /></span>
              <span className="min-w-0">
                <span className="block font-sans text-xs font-extrabold uppercase tracking-[0.12em] sm:text-sm">
                  <span className="text-primary-text">VIBE</span><span className="text-white">GAMES</span><span className="text-text-secondary">.NINJA</span>
                </span>
                <span className="mt-1 block font-arcade text-[7px] leading-3 tracking-wide text-text-tertiary">THE COMMUNITY ARCADE</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav aria-label="Main navigation" className="hidden h-full items-center gap-1 xl:flex">
              {navigation.filter((item) => item.href !== "/upload").map((item) => {
                const isActive = isNavigationActive(item.href)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    prefetch={item.href === "/upload" ? false : (prefetchLinks ? undefined : false)}
                    className={`relative flex h-full items-center px-2.5 text-[10px] font-bold tracking-[0.07em] transition-colors after:absolute after:inset-x-2.5 after:bottom-0 after:h-[3px] ${
                      isActive
                        ? "text-arcade-yellow after:bg-arcade-yellow"
                        : "text-text-secondary hover:text-white hover:after:bg-border-strong"
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            <form onSubmit={submitSearch} role="search" className="relative ml-auto hidden w-52 shrink lg:block xl:w-40 2xl:w-52">
              <label htmlFor="global-game-search" className="sr-only">Search games</label>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
              <input
                id="global-game-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                maxLength={MAX_DISCOVERY_SEARCH_LENGTH}
                placeholder="Find a game..."
                className="h-11 w-full border border-border-strong bg-surface pl-9 pr-9 text-sm text-text placeholder:text-text-tertiary focus:border-arcade-yellow focus:outline-none"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 grid h-11 w-9 place-items-center text-text-secondary transition-colors hover:text-arcade-yellow"
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
                  <Link href="/upload" prefetch={false} className="hidden sm:block xl:hidden">
                    <Button size="icon" aria-label="Upload game" className="h-11 w-11">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </Link>

                  <div className="hidden xl:flex items-center gap-2">
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
                        <Button variant="outline" size="icon" className="border-border-strong bg-surface" aria-label="Open account menu">
                          <User className="h-4 w-4 text-primary-text" />
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
                <div className="hidden xl:flex items-center gap-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/login" prefetch={prefetchLinks ? undefined : false}>
                      Sign in
                    </Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/register" prefetch={prefetchLinks ? undefined : false}>
                      Join the arcade
                    </Link>
                  </Button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                ref={mobileMenuButtonRef}
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="grid h-11 w-11 place-items-center border border-border-strong bg-surface text-white transition-colors hover:border-arcade-yellow xl:hidden"
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
            ref={mobileMenuRef}
            id="mobile-navigation-menu"
            inert={!mobileMenuOpen}
            role={mobileMenuOpen ? "dialog" : undefined}
            aria-modal={mobileMenuOpen ? true : undefined}
            aria-label="Arcade navigation"
            className={`xl:hidden overflow-hidden border-t border-border transition-[max-height,opacity] duration-200 ease-out ${
              mobileMenuOpen
                ? "max-h-[calc(100dvh-8rem-env(safe-area-inset-top))] opacity-100"
                : "max-h-0 border-t-0 opacity-0"
            }`}
          >
            <div className="max-h-[calc(100dvh-8rem-env(safe-area-inset-top))] space-y-4 overflow-y-auto overscroll-contain py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center justify-between">
                <span className="font-arcade text-[9px] text-arcade-yellow">CHOOSE YOUR NEXT MOVE</span>
                <button type="button" className="grid h-10 w-10 place-items-center text-text-secondary hover:text-white" aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)}><X className="h-5 w-5" /></button>
              </div>
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
              <nav aria-label="Mobile navigation" className="grid gap-2 sm:grid-cols-2">
                {navigation.map((item, index) => {
                  const isActive = isNavigationActive(item.href)
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      prefetch={item.href === "/upload" ? false : (prefetchLinks ? undefined : false)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex min-h-14 items-center gap-3 border px-3 text-xs font-bold tracking-wider transition-colors ${
                        isActive
                          ? "border-arcade-yellow/60 bg-arcade-yellow/5 text-arcade-yellow"
                          : "border-border bg-surface text-white hover:border-border-strong"
                      }`}
                    >
                      <span aria-hidden="true" className="font-arcade text-[9px] text-text-tertiary">0{index + 1}</span>
                      <span className="flex-1">{item.name}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )
                })}
              </nav>
              <div className="flex flex-wrap gap-x-5 text-sm text-text-secondary">
                <Link href="/library" prefetch={false} onClick={() => setMobileMenuOpen(false)} className="inline-flex min-h-11 items-center hover:text-white">Source library</Link>
                <Link href="/creator/projects" prefetch={false} onClick={() => setMobileMenuOpen(false)} className="inline-flex min-h-11 items-center hover:text-white">Stories & source</Link>
              </div>

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
                  <Button asChild variant="outline" className="h-11 w-full"><Link href="/login" prefetch={prefetchLinks ? undefined : false} onClick={() => setMobileMenuOpen(false)}>Sign in</Link></Button>
                  <Button asChild className="h-11 w-full"><Link href="/register" prefetch={prefetchLinks ? undefined : false} onClick={() => setMobileMenuOpen(false)}>Join the arcade</Link></Button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </header>
  )
}
