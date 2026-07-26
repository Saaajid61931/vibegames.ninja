import Link from "next/link"
import { Gamepad2, Heart, Lightbulb, Sparkles, Upload, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { HomePageData } from "@/lib/home-page-data"

type HomeCategoryBarProps = {
  categoryLinks: HomePageData["categoryLinks"]
}

export function HomeCategoryBar() {
  return (
    <section
      aria-labelledby="home-discovery-options"
      className="overflow-hidden border-b-2 border-[#4a4a6a] bg-[#1a1a2e] py-6 sm:border-b-4"
    >
      <div className="container mx-auto px-4">
        <h2 id="home-discovery-options" className="sr-only">Game discovery options</h2>
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
          <Link href="/games" prefetch={false}>
            <Button variant="arcade-outline" size="sm" className="rounded-full">ALL GAMES</Button>
          </Link>
          <Link href="/games?category=action" prefetch={false}>
            <Button variant="outline" size="sm" className="rounded-full border-[#0080ff] text-[#0080ff] hover:bg-[#0080ff] hover:text-white">ACTION</Button>
          </Link>
          <Link href="/games?category=puzzle" prefetch={false}>
            <Button variant="outline" size="sm" className="rounded-full border-[#ffff00] text-[#ffff00] hover:bg-[#ffff00] hover:text-black">PUZZLE</Button>
          </Link>
          <Link href="/games?category=rpg" prefetch={false}>
            <Button variant="outline" size="sm" className="rounded-full border-[#ff0040] text-[#ff0040] hover:bg-[#ff0040] hover:text-white">RPG</Button>
          </Link>
          <Link href="/games?category=adventure" prefetch={false}>
            <Button variant="outline" size="sm" className="rounded-full border-[#00ff40] text-[#00ff40] hover:bg-[#00ff40] hover:text-black">ADVENTURE</Button>
          </Link>
          <Link href="/games?category=arcade" prefetch={false}>
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
              <Link href="/jams" prefetch={false}>
                <Button variant="arcade">VIEW GAME JAMS</Button>
              </Link>
              <Link href="/upload" prefetch={false}>
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
  const steps = [
    {
      icon: Gamepad2,
      title: "PLAY",
      description: "Jump into community-made games in your browser.",
      color: "#facc15",
    },
    {
      icon: Lightbulb,
      title: "GET INSPIRED",
      description: "Find ideas, creators, genres, and experiments that stand out.",
      color: "#818cf8",
    },
    {
      icon: Upload,
      title: "BUILD",
      description: "Turn your own idea into something other people can play.",
      color: "#22c55e",
    },
    {
      icon: Heart,
      title: "INSPIRE OTHERS",
      description: "Share your work and help the next creator start.",
      color: "#f43f5e",
    },
  ] as const

  return (
    <section className="border-b-2 border-[#4a4a6a] py-14 sm:border-b-4 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center sm:mb-16">
          <div className="mb-4 inline-flex items-center gap-2 border-2 border-[#ff0040] bg-[#1a1a2e] px-3 py-2 sm:border-4 sm:px-4">
            <Sparkles className="h-5 w-5 text-[#ff0040]" />
            <span className="font-pixel text-[10px] text-[#ff0040]">THE COMMUNITY LOOP</span>
          </div>
          <h2 className="font-pixel text-xl font-bold text-white sm:text-2xl md:text-3xl">
            PLAY. GET INSPIRED. BUILD. INSPIRE.
          </h2>
        </div>

        <ol className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <li
                key={step.title}
                className="group border-2 border-[#4a4a6a] bg-[#1a1a2e] p-5 transition-all hover:-translate-x-1 hover:-translate-y-1 hover:border-[#ffff00] hover:shadow-[4px_4px_0_#ffff00] sm:border-4 sm:p-6"
              >
                <div className="mb-5 flex items-start justify-between">
                  <div
                    className="flex h-14 w-14 items-center justify-center border-2 border-[#4a4a6a] transition-colors group-hover:border-white sm:h-16 sm:w-16 sm:border-4"
                    style={{ backgroundColor: `${step.color}20` }}
                  >
                    <Icon className="h-7 w-7 sm:h-8 sm:w-8" style={{ color: step.color }} />
                  </div>
                  <span className="font-pixel text-[9px] text-[#4a4a6a]">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mb-3 font-pixel text-[11px]" style={{ color: step.color }}>
                  {step.title}
                </h3>
                <p className="font-arcade text-sm leading-6 text-[#aab6d0] sm:text-base">
                  {step.description}
                </p>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

export function HomeCommunityCta() {
  return (
    <section className="py-14 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="relative mx-auto max-w-4xl border-2 border-[#ffff00] bg-[#1a1a2e] p-6 sm:border-4 sm:p-8 md:p-12">
          <div className="absolute -left-2 -top-2 h-6 w-6 bg-[#ffff00]" />
          <div className="absolute -right-2 -top-2 h-6 w-6 bg-[#ffff00]" />
          <div className="absolute -bottom-2 -left-2 h-6 w-6 bg-[#ffff00]" />
          <div className="absolute -bottom-2 -right-2 h-6 w-6 bg-[#ffff00]" />

          <div className="text-center">
            <div className="mb-6 flex items-center justify-center gap-3 sm:gap-4">
              <Heart className="h-6 w-6 animate-pulse text-[#ff0040] sm:h-8 sm:w-8" />
              <h2 className="text-center font-pixel text-xl font-bold text-white sm:text-2xl md:text-3xl">
                INSPIRED? BUILD SOMETHING.
              </h2>
              <Heart className="h-6 w-6 animate-pulse text-[#ff0040] sm:h-8 sm:w-8" />
            </div>

            <div className="mb-8 space-y-3 font-arcade text-sm text-[#aab6d0] sm:text-lg">
              <p>Turn an idea you want to play into something real.</p>
              <p>Share it with the community and inspire the next creator.</p>
            </div>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/upload" prefetch={false}>
                <Button variant="arcade" size="lg" className="gap-3">
                  <Upload className="h-5 w-5" />
                  BUILD A GAME
                </Button>
              </Link>
              <Link href="/games" prefetch={false}>
                <Button variant="secondary" size="lg" className="gap-3">
                  <Gamepad2 className="h-5 w-5" />
                  KEEP PLAYING
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
    <section className="border-b-2 border-[#4a4a6a] bg-[#11111d] py-14 sm:border-b-4 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#00d1ff]" />
              <span className="font-pixel text-[10px] text-[#00d1ff]">DISCOVERY SHORTCUTS</span>
            </div>
            <h2 className="font-pixel text-xl text-white sm:text-2xl md:text-3xl">
              CHOOSE HOW YOU WANT TO PLAY
            </h2>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/games?mobile=true" prefetch={false} className="group border-2 border-[#4a4a6a] bg-[#1a1a2e] p-5 transition-all hover:-translate-y-1 hover:border-[#22c55e]">
            <p className="font-pixel text-[10px] text-[#22c55e]">PLAY ANYWHERE</p>
            <h3 className="mt-2 font-pixel text-sm text-white">MOBILE-FRIENDLY GAMES</h3>
            <p className="mt-3 font-arcade text-sm text-[#8b93a6]">Touch-ready games for shorter sessions and smaller screens.</p>
          </Link>
          <Link href="/games?editor=true" prefetch={false} className="group border-2 border-[#4a4a6a] bg-[#1a1a2e] p-5 transition-all hover:-translate-y-1 hover:border-[#ffff00]">
            <p className="font-pixel text-[10px] text-[#ffff00]">MAKE IT YOURS</p>
            <h3 className="mt-2 font-pixel text-sm text-white">LEVEL EDITOR PICKS</h3>
            <p className="mt-3 font-arcade text-sm text-[#8b93a6]">Play games with tools for remixing levels and ideas.</p>
          </Link>
          <Link href="/jams" prefetch={false} className="group border-2 border-[#4a4a6a] bg-[#1a1a2e] p-5 transition-all hover:-translate-y-1 hover:border-[#ff0040]">
            <p className="font-pixel text-[10px] text-[#ff0040]">BUILD TOGETHER</p>
            <h3 className="mt-2 font-pixel text-sm text-white">COMMUNITY GAME JAMS</h3>
            <p className="mt-3 font-arcade text-sm text-[#8b93a6]">Create around a shared theme and see what other builders make.</p>
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {categoryLinks.map((category) => (
            <Link key={category.value} href={category.href} prefetch={false}>
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
