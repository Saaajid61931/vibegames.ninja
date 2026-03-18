import Link from "next/link"
import { Gamepad2, Heart, Star, Trophy, Upload, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { HomePageData } from "@/lib/home-page-data"

type HomeCategoryBarProps = {
  categoryLinks: HomePageData["categoryLinks"]
}

export function HomeCategoryBar() {
  return (
    <section className="border-b-2 sm:border-b-4 border-[#4a4a6a] bg-[#1a1a2e] py-6 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
          <Link href="/games">
            <Button variant="arcade-outline" size="sm" className="rounded-full">ALL GAMES</Button>
          </Link>
          <Link href="/games?category=action">
            <Button variant="outline" size="sm" className="rounded-full border-[#0080ff] text-[#0080ff] hover:bg-[#0080ff] hover:text-white">ACTION</Button>
          </Link>
          <Link href="/games?category=puzzle">
            <Button variant="outline" size="sm" className="rounded-full border-[#ffff00] text-[#ffff00] hover:bg-[#ffff00] hover:text-black">PUZZLE</Button>
          </Link>
          <Link href="/games?category=rpg">
            <Button variant="outline" size="sm" className="rounded-full border-[#ff0040] text-[#ff0040] hover:bg-[#ff0040] hover:text-white">RPG</Button>
          </Link>
          <Link href="/games?category=adventure">
            <Button variant="outline" size="sm" className="rounded-full border-[#00ff40] text-[#00ff40] hover:bg-[#00ff40] hover:text-black">ADVENTURE</Button>
          </Link>
          <Link href="/games?category=arcade">
            <Button variant="outline" size="sm" className="rounded-full border-[#ffa500] text-[#ffa500] hover:bg-[#ffa500] hover:text-black">ARCADE</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export function HomeCommunityMomentumSection() {
  return (
    <section className="border-b-2 sm:border-b-4 border-[#4a4a6a] bg-[#11111d] py-10 sm:py-14">
      <div className="container mx-auto px-4">
        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="border-2 border-[#4a4a6a] bg-[#1a1a2e] p-5 sm:p-6">
            <p className="font-pixel text-[10px] text-[#22c55e]">COMMUNITY MOMENTUM</p>
            <h2 className="mt-2 font-pixel text-lg text-white sm:text-2xl">GAME JAMS DRIVE THE ENERGY</h2>
            <p className="mt-3 max-w-2xl font-arcade text-sm text-[#c9d1ff]">
              One strong jam system is better than scattered mini-events. Themes, deadlines, banners, submissions, and voting now live in one place.
            </p>
            <p className="mt-2 font-arcade text-sm text-[#8b93a6]">
              Join an active jam to build around a theme, get discovered faster, and give creators a clearer reason to upload now.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/jams">
                <Button variant="arcade">VIEW GAME JAMS</Button>
              </Link>
              <Link href="/upload">
                <Button variant="outline">UPLOAD A JAM BUILD</Button>
              </Link>
            </div>
          </div>

          <div className="border-2 border-[#4a4a6a] bg-[#1a1a2e] p-5 sm:p-6">
            <p className="font-pixel text-[10px] text-[#00d1ff]">WHY CREATORS USE THIS</p>
            <div className="mt-3 space-y-3 font-arcade text-sm text-[#c9d1ff]">
              <p>Every new launch gets a real discovery lane.</p>
              <p>You can mark one game as seeking feedback when you want eyes, not just likes.</p>
              <p>Your public profile now works more like a living portfolio than a file dump.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function HomeFeatureGrid() {
  const features = [
    { icon: Zap, title: "EXPLORE IDEAS", desc: "Discover games made by creative people worldwide", color: "#ffff00" },
    { icon: Upload, title: "NO SKILLS NEEDED", desc: "Build with AI. No coding required", color: "#0080ff" },
    { icon: Heart, title: "SHARE & INSPIRE", desc: "Comment, share, and build community levels", color: "#ff0040" },
    { icon: Trophy, title: "ZERO BARRIERS", desc: "Free forever. Everyone is a creator", color: "#00ff40" },
  ] as const

  return (
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
                <p className="font-arcade text-sm text-[#aab6d0] sm:text-base">{feature.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function HomeCommunityCta() {
  return (
    <section className="py-14 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-[#1a1a2e] border-2 sm:border-4 border-[#ffff00] p-6 sm:p-8 md:p-12 relative">
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-[#ffff00]" />
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#ffff00]" />
          <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-[#ffff00]" />
          <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-[#ffff00]" />

          <div className="text-center">
            <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6">
              <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-[#ff0040] animate-pulse" />
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-pixel text-center">
                JOIN THE COMMUNITY
              </h2>
              <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-[#ff0040] animate-pulse" />
            </div>

            <div className="mb-8 space-y-3 font-arcade text-sm text-[#aab6d0] sm:space-y-4 sm:text-lg">
              <p>Share your creativity with the world</p>
              <p>Get inspired by other creators</p>
              <p>Connect and collaborate</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button variant="arcade" size="lg" className="gap-3">
                  <Upload className="h-5 w-5" />
                  START CREATING
                </Button>
              </Link>
              <Link href="/games">
                <Button variant="secondary" size="lg" className="gap-3">
                  <Gamepad2 className="h-5 w-5" />
                  BROWSE GAMES
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function HomeDiscoveryShortcuts({ categoryLinks }: HomeCategoryBarProps) {
  return (
    <section className="border-b-2 sm:border-b-4 border-[#4a4a6a] bg-[#11111d] py-14 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#00d1ff]" />
              <span className="font-pixel text-[10px] text-[#00d1ff]">DISCOVERY SHORTCUTS</span>
            </div>
            <h2 className="font-pixel text-xl text-white sm:text-2xl md:text-3xl">FIND YOUR NEXT RABBIT HOLE</h2>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/games?mobile=true" className="group border-2 border-[#4a4a6a] bg-[#1a1a2e] p-5 transition-all hover:border-[#22c55e] hover:-translate-y-1">
            <p className="font-pixel text-[10px] text-[#22c55e]">PLAY ANYWHERE</p>
            <h3 className="mt-2 font-pixel text-sm text-white">MOBILE-FRIENDLY GAMES</h3>
            <p className="mt-3 font-arcade text-sm text-[#8b93a6]">Short sessions, touch controls, and games that feel good on the go.</p>
          </Link>
          <Link href="/games?editor=true" className="group border-2 border-[#4a4a6a] bg-[#1a1a2e] p-5 transition-all hover:border-[#ffff00] hover:-translate-y-1">
            <p className="font-pixel text-[10px] text-[#ffff00]">MAKE IT YOURS</p>
            <h3 className="mt-2 font-pixel text-sm text-white">LEVEL EDITOR PICKS</h3>
            <p className="mt-3 font-arcade text-sm text-[#8b93a6]">Play, remix, and publish community levels to keep games alive longer.</p>
          </Link>
          <Link href="/jams" className="group border-2 border-[#4a4a6a] bg-[#1a1a2e] p-5 transition-all hover:border-[#ff0040] hover:-translate-y-1">
            <p className="font-pixel text-[10px] text-[#ff0040]">COMMUNITY EVENTS</p>
            <h3 className="mt-2 font-pixel text-sm text-white">JOIN A GAME JAM</h3>
            <p className="mt-3 font-arcade text-sm text-[#8b93a6]">Compete, get discovered, and ride the momentum of deadline-driven launches.</p>
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {categoryLinks.map((category) => (
            <Link key={category.value} href={category.href}>
              <Button variant="outline" size="sm" className="rounded-full border-[#4a4a6a] text-[#c9d1ff] hover:border-[#ffff00] hover:text-[#ffff00]">
                {category.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
