import Link from "next/link"
import { ArrowUpRight, Puzzle, Smartphone, Zap } from "lucide-react"
export const inspirationCollections = [
  {
    title: "Clever puzzles",
    description: "A new rule, a small surprise, a satisfying solution.",
    href: "/games?category=puzzle",
    mark: "01",
    icon: Puzzle,
    color: "var(--color-arcade-cyan)",
  },
  {
    title: "Made for your thumbs",
    description: "Small worlds you can play wherever you are.",
    href: "/games?mobile=true",
    mark: "02",
    icon: Smartphone,
    color: "var(--color-arcade-yellow)",
  },
  {
    title: "Fresh experiments",
    description: "Meet the newest ideas from the community.",
    href: "/games?sort=new",
    mark: "03",
    icon: Zap,
    color: "var(--color-arcade-red)",
  },
]
export function InspirationCollections() {
  return (
    <section className="container mx-auto px-4 py-10 sm:py-12">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-kicker text-arcade-cyan">
            02 / FIND YOUR KIND OF FUN
          </p>
          <h2 className="mt-3 heading-pixel-md text-white">CHOOSE YOUR ADVENTURE</h2>
        </div>
        <Link href="/collections" prefetch={false} className="flex min-h-11 shrink-0 items-center gap-2 text-xs font-bold text-text-secondary hover:text-arcade-cyan">
          Collections <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {inspirationCollections.map((item) => (
          <Link key={item.mark} href={item.href} prefetch={false} className="inspiration-tile group" style={{ borderTopColor: item.color }}>
            <div className="flex items-center justify-between"><item.icon className="h-7 w-7" style={{ color: item.color }} /><span className="text-kicker text-text-secondary">{item.mark} / EXPLORE</span></div>
            <h3 className="mt-5 flex items-center justify-between gap-3 text-lg font-semibold text-white">
              {item.title}
              <ArrowUpRight className="h-4 w-4" />
            </h3>
            <p className="mt-2 text-sm leading-6 text-text-secondary">{item.description}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
