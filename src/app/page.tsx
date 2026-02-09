import Link from "next/link"
import { unstable_cache } from "next/cache"
import { Gamepad2, Upload, Trophy, Zap, Coins, ChevronRight, Star, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { GameCard } from "@/components/games/game-card"
import prisma from "@/lib/prisma"
import { getDiscoveryOrderBy } from "@/lib/discovery"

const getFeaturedGames = unstable_cache(async () => {
  const games = await prisma.game.findMany({
    where: { status: "PUBLISHED" },
    include: {
      creator: {
        select: { id: true, name: true, username: true, image: true }
      }
    },
    orderBy: getDiscoveryOrderBy("trending"),
    take: 6,
  })
  return games
}, ["home-featured-games"], { revalidate: 60, tags: ["games"] })

const getStats = unstable_cache(async () => {
  const [gamesCount, usersCount, totalPlays] = await Promise.all([
    prisma.game.count({ where: { status: "PUBLISHED" } }),
    prisma.user.count(),
    prisma.game.aggregate({ _sum: { plays: true } }),
  ])
  return {
    games: gamesCount,
    creators: usersCount,
    plays: totalPlays._sum.plays || 0,
  }
}, ["home-stats"], { revalidate: 60, tags: ["games", "users"] })

export default async function HomePage() {
  const [games, stats] = await Promise.all([getFeaturedGames(), getStats()])
  const normalizedGames = games.map((game) => ({
    ...game,
    createdAt: new Date(game.createdAt),
  }))

  const features = [
    { icon: Zap, title: "AI POWERED", desc: "Built with Claude, GPT, Cursor & more", color: "#ffff00" },
    { icon: Upload, title: "INSTANT DEPLOY", desc: "Upload ZIP or HTML. Live in seconds", color: "#0080ff" },
    { icon: Coins, title: "65-85% PAYOUT", desc: "Highest creator revenue share", color: "#00ff40" },
    { icon: Trophy, title: "NO GATEKEEPERS", desc: "No app stores. No approvals. Just games.", color: "#ff0040" },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d15]">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section - Arcade Cabinet Style */}
        <section className="relative overflow-hidden border-b-2 sm:border-b-4 border-[#4a4a6a]">
          {/* Pixel Background */}
          <div className="absolute inset-0 pixel-bg" />
          
          {/* Screen Glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0080ff]/10 via-transparent to-[#ff0040]/10" />
          
          <div className="relative container mx-auto px-4 py-14 sm:py-20 md:py-32">
            {/* High Score Display */}
            <div className="mb-8 flex justify-center">
              <div className="inline-flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#1a1a2e] border-2 sm:border-4 border-[#ffff00] shadow-[3px_3px_0_#ffff00] sm:shadow-[4px_4px_0_#ffff00]">
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-[#ffff00]" />
                <div>
                  <div className="text-[10px] text-[#4a4a6a] font-pixel">HIGH SCORE</div>
                  <div className="text-xl sm:text-2xl text-[#ffff00] font-pixel">999,999</div>
                </div>
              </div>
            </div>

            <div className="max-w-5xl mx-auto text-center">
              {/* Main Title */}
              <h1 className="mb-8">
                <span
                  className="block text-[clamp(1.6rem,8.5vw,2.3rem)] sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-3 sm:mb-4 leading-[1.05]"
                  style={{ fontFamily: "var(--font-pixel), monospace" }}
                >
                  AI GENERATED
                </span>
                <span
                  className="block text-[clamp(1.6rem,8.5vw,2.3rem)] sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#ffff00] leading-[1.05] drop-shadow-[3px_3px_0_#ff0040] sm:drop-shadow-[4px_4px_0_#ff0040]"
                  style={{ fontFamily: "var(--font-pixel), monospace" }}
                >
                  ARCADE
                </span>
              </h1>
              
              <p className="text-base sm:text-xl md:text-2xl text-[#4a4a6a] mb-8 sm:mb-12 max-w-2xl mx-auto font-arcade">
                Build with AI. Publish instantly. No app stores. No gatekeepers.
                Just pure HTML5 games and epic revenue share.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/games">
                  <Button variant="arcade" size="xl" className="gap-3">
                    <Gamepad2 className="h-5 w-5" />
                    START GAME
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" size="xl" className="gap-3">
                    <Star className="h-5 w-5" />
                    BECOME A CREATOR
                  </Button>
                </Link>
              </div>

              {/* Stats Bar - Arcade Score Style */}
              <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t-2 sm:border-t-4 border-[#4a4a6a] grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto">
                <div className="text-center p-3 sm:p-4 bg-[#1a1a2e] border-2 border-[#0080ff]">
                  <div className="text-[10px] text-[#0080ff] mb-1 font-pixel">GAMES</div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-pixel">
                    {stats.games.toString().padStart(6, '0')}
                  </div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-[#1a1a2e] border-2 border-[#ff0040]">
                  <div className="text-[10px] text-[#ff0040] mb-1 font-pixel">CREATORS</div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-pixel">
                    {stats.creators.toString().padStart(6, '0')}
                  </div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-[#1a1a2e] border-2 border-[#ffff00]">
                  <div className="text-[10px] text-[#ffff00] mb-1 font-pixel">PLAYS</div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-pixel">
                    {(stats.plays % 1000000).toString().padStart(6, '0')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Side Joysticks Decoration */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden xl:block">
            <div className="joystick-base mb-4" />
            <div className="flex gap-2 justify-center">
              <div className="w-8 h-8 bg-[#ff0040] rounded-full border-2 border-[#1a1a2e]" />
              <div className="w-8 h-8 bg-[#0080ff] rounded-full border-2 border-[#1a1a2e]" />
            </div>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden xl:block">
            <div className="joystick-base mb-4" />
            <div className="flex gap-2 justify-center">
              <div className="w-8 h-8 bg-[#ffff00] rounded-full border-2 border-[#1a1a2e]" />
              <div className="w-8 h-8 bg-[#00ff40] rounded-full border-2 border-[#1a1a2e]" />
            </div>
          </div>
        </section>

        {/* Marquee */}
        <div className="border-y-2 sm:border-y-4 border-[#ffff00] bg-[#ff0040] overflow-hidden">
          <div className="animate-[marquee_15s_linear_infinite] whitespace-nowrap py-3 sm:py-4">
            <span className="font-pixel text-xs sm:text-sm text-white px-6 sm:px-8">
              🎮 INSERT COIN TO PLAY • NEW GAMES DAILY • AI POWERED ARCADE • JOIN THE REVOLUTION • HIGH SCORE CHASE • 🎮 INSERT COIN TO PLAY • NEW GAMES DAILY • AI POWERED ARCADE • JOIN THE REVOLUTION • HIGH SCORE CHASE •
            </span>
          </div>
        </div>

        {/* Featured Games */}
        <section className="py-14 sm:py-20 border-b-2 sm:border-b-4 border-[#4a4a6a]">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 sm:mb-12">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-5 w-5 text-[#ffff00]" />
                  <span className="text-[10px] text-[#ffff00] font-pixel">TOP GAMES</span>
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-pixel">
                  FEATURED ARCADE
                </h2>
              </div>
              <Link href="/games">
                <Button variant="secondary" size="sm" className="gap-2">
                  VIEW ALL
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            {normalizedGames.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
                {normalizedGames.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border-4 border-dashed border-[#4a4a6a]">
                <Gamepad2 className="h-16 w-16 text-[#4a4a6a] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#4a4a6a] mb-2 font-pixel">NO GAMES FOUND</h3>
                <p className="text-[#4a4a6a] mb-6 font-arcade text-lg">Be the first to deploy!</p>
                <Link href="/upload">
                  <Button variant="arcade">UPLOAD GAME</Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Features - Arcade Cabinet Style */}
        <section className="py-14 sm:py-20 border-b-2 sm:border-b-4 border-[#4a4a6a]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10 sm:mb-16">
              <div className="inline-flex items-center gap-2 mb-4 px-3 sm:px-4 py-2 bg-[#1a1a2e] border-2 sm:border-4 border-[#ff0040]">
                <Star className="h-5 w-5 text-[#ff0040]" />
                <span className="text-[10px] text-[#ff0040] font-pixel">POWER UPS</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-pixel">
                WHY PLAY HERE?
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <div 
                    key={feature.title}
                    className="p-5 sm:p-6 bg-[#1a1a2e] border-2 sm:border-4 border-[#4a4a6a] hover:border-[#ffff00] transition-all group hover:shadow-[4px_4px_0_#ffff00] hover:-translate-x-1 hover:-translate-y-1"
                  >
                    <div 
                      className="w-14 h-14 sm:w-16 sm:h-16 border-2 sm:border-4 border-[#4a4a6a] group-hover:border-white flex items-center justify-center mb-4 sm:mb-6 transition-all"
                      style={{ backgroundColor: `${feature.color}20` }}
                    >
                      <Icon className="h-7 w-7 sm:h-8 sm:w-8" style={{ color: feature.color }} />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-3 font-pixel" style={{ color: feature.color }}>
                      {feature.title}
                    </h3>
                    <p className="text-sm sm:text-base text-[#4a4a6a] font-arcade">{feature.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Insert Coin CTA */}
        <section className="py-14 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto bg-[#1a1a2e] border-2 sm:border-4 border-[#ffff00] p-6 sm:p-8 md:p-12 relative">
              {/* Corner decorations */}
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-[#ffff00]" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#ffff00]" />
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-[#ffff00]" />
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-[#ffff00]" />
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6">
                  <Coins className="h-6 w-6 sm:h-8 sm:w-8 text-[#ffff00] animate-bounce" />
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-pixel text-center">
                    INSERT COIN TO START
                  </h2>
                  <Coins className="h-6 w-6 sm:h-8 sm:w-8 text-[#ffff00] animate-bounce" />
                </div>
                
                <div className="space-y-3 sm:space-y-4 text-sm sm:text-lg text-[#4a4a6a] mb-8 font-arcade">
                  <p>🎮 Ready to publish your first AI game?</p>
                  <p>⚡ Connect to our distribution network</p>
                  <p>💰 Revenue sharing: <span className="text-[#00ff40] font-bold">ACTIVE</span></p>
                  <p>🏆 Start your creator journey today!</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/register">
                    <Button variant="arcade" size="lg" className="gap-3">
                      <Heart className="h-5 w-5" />
                      START CREATING
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button variant="secondary" size="lg">
                      VIEW PLANS
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  )
}
