import Link from "next/link"
import { Gamepad2, Heart, Lightbulb, Sparkles, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HomeCategoryBar() {
  return (
    <section
      aria-labelledby="home-discovery-options"
      className="overflow-hidden border-b-2 border-border-strong bg-surface-2 py-6 sm:border-b-4"
    >
      <div className="container mx-auto px-4">
        <h2 id="home-discovery-options" className="sr-only">Game discovery options</h2>
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
          <Link href="/games" prefetch={false}>
            <Button variant="arcade-outline" size="sm" className="rounded-full">ALL GAMES</Button>
          </Link>
          <Link href="/games?category=action" prefetch={false}>
            <Button variant="outline" size="sm" className="rounded-full border-arcade-blue text-arcade-blue hover:bg-arcade-blue hover:text-white">ACTION</Button>
          </Link>
          <Link href="/games?category=puzzle" prefetch={false}>
            <Button variant="outline" size="sm" className="rounded-full border-arcade-yellow text-arcade-yellow hover:bg-arcade-yellow hover:text-black">PUZZLE</Button>
          </Link>
          <Link href="/games?category=rpg" prefetch={false}>
            <Button variant="outline" size="sm" className="rounded-full border-arcade-red text-arcade-red hover:bg-arcade-red hover:text-white">RPG</Button>
          </Link>
          <Link href="/games?category=adventure" prefetch={false}>
            <Button variant="outline" size="sm" className="rounded-full border-arcade-green text-arcade-green hover:bg-arcade-green hover:text-black">ADVENTURE</Button>
          </Link>
          <Link href="/games?category=arcade" prefetch={false}>
            <Button variant="outline" size="sm" className="rounded-full border-arcade-orange text-arcade-orange hover:bg-arcade-orange hover:text-black">ARCADE</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export function HomeCommunityMomentumSection() {
  return (
    <section className="border-b-2 sm:border-b-4 border-border-strong bg-surface py-10 sm:py-14">
      <div className="container mx-auto px-4">
        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="border-2 border-border-strong bg-surface-2 p-5 sm:p-6">
            <p className="text-kicker text-success">COMMUNITY MOMENTUM</p>
            <h2 className="heading-pixel-lg mt-2 text-white">GAME JAMS DRIVE THE ENERGY</h2>
            <p className="mt-3 max-w-2xl font-arcade text-sm text-text-secondary">
              One strong jam system is better than scattered mini-events. Themes, deadlines, banners, submissions, and voting now live in one place.
            </p>
            <p className="mt-2 font-arcade text-sm text-text-secondary">
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

          <div className="border-2 border-border-strong bg-surface-2 p-5 sm:p-6">
            <p className="text-kicker text-arcade-cyan">WHY CREATORS USE THIS</p>
            <div className="mt-3 space-y-3 font-arcade text-sm text-text-secondary">
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
      color: "var(--color-arcade-yellow)",
    },
    {
      icon: Lightbulb,
      title: "GET INSPIRED",
      description: "Find ideas, creators, genres, and experiments that stand out.",
      color: "var(--color-primary-hover-text)",
    },
    {
      icon: Upload,
      title: "BUILD",
      description: "Turn your own idea into something other people can play.",
      color: "var(--color-success)",
    },
    {
      icon: Heart,
      title: "INSPIRE OTHERS",
      description: "Share your work and help the next creator start.",
      color: "var(--color-arcade-red)",
    },
  ] as const

  return (
    <section className="border-b-2 border-border-strong py-14 sm:border-b-4 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center sm:mb-16">
          <div className="mb-4 inline-flex items-center gap-2 border-2 border-arcade-red bg-surface-2 px-3 py-2 sm:border-4 sm:px-4">
            <Sparkles className="h-5 w-5 text-arcade-red" />
            <span className="text-kicker text-arcade-red">THE COMMUNITY LOOP</span>
          </div>
          <h2 className="heading-pixel-lg font-bold text-white">
            PLAY. GET INSPIRED. BUILD. INSPIRE.
          </h2>
        </div>

        <ol className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <li
                key={step.title}
                className="group border-2 border-border-strong bg-surface-2 p-5 [--shadow-color:var(--color-arcade-yellow)] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:border-arcade-yellow hover:shadow-hard-4 sm:border-4 sm:p-6"
              >
                <div className="mb-5 flex items-start justify-between">
                  <div
                    className="flex h-14 w-14 items-center justify-center border-2 border-border-strong transition-colors group-hover:border-white sm:h-16 sm:w-16 sm:border-4"
                    style={{ backgroundColor: `${step.color}20` }}
                  >
                    <Icon className="h-7 w-7 sm:h-8 sm:w-8" style={{ color: step.color }} />
                  </div>
                  <span className="text-kicker  text-text-secondary">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="heading-pixel-sm mb-3" style={{ color: step.color }}>
                  {step.title}
                </h3>
                <p className="font-arcade text-sm leading-6 text-text-secondary sm:text-base">
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
        <div className="relative mx-auto max-w-4xl border-2 border-arcade-yellow bg-surface-2 p-6 sm:border-4 sm:p-8 md:p-12">
          <div className="absolute -left-2 -top-2 h-6 w-6 bg-arcade-yellow" />
          <div className="absolute -right-2 -top-2 h-6 w-6 bg-arcade-yellow" />
          <div className="absolute -bottom-2 -left-2 h-6 w-6 bg-arcade-yellow" />
          <div className="absolute -bottom-2 -right-2 h-6 w-6 bg-arcade-yellow" />

          <div className="text-center">
            <div className="mb-6 flex items-center justify-center gap-3 sm:gap-4">
              <Heart className="h-6 w-6 animate-pulse text-arcade-red sm:h-8 sm:w-8" />
              <h2 className="heading-pixel-lg text-center font-bold text-white">
                INSPIRED? BUILD SOMETHING.
              </h2>
              <Heart className="h-6 w-6 animate-pulse text-arcade-red sm:h-8 sm:w-8" />
            </div>

            <div className="mb-8 space-y-3 font-arcade text-sm text-text-secondary sm:text-lg">
              <p>Turn an idea you want to play into something real.</p>
              <p>Share it with the community and inspire the next creator.</p>
            </div>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/upload" prefetch={false}>
                <Button variant="arcade" size="lg" className="gap-3">
                  <Upload className="h-5 w-5" />
                  SHARE A GAME
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
