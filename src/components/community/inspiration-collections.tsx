import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
export const inspirationCollections = [
  {
    title: "Clever puzzles",
    description: "A new rule, a small surprise, a satisfying solution.",
    href: "/games?category=puzzle",
    mark: "01",
  },
  {
    title: "Made for your thumbs",
    description: "Small worlds you can play wherever you are.",
    href: "/games?mobile=true",
    mark: "02",
  },
  {
    title: "Fresh experiments",
    description: "Meet the newest ideas from the community.",
    href: "/games?sort=new",
    mark: "03",
  },
]
export function InspirationCollections() {
  return (
    <section className="container mx-auto px-4 py-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-primary-text">
            Follow your curiosity
          </p>
          <h2 className="mt-1 heading-pixel-md text-white text-white">Find your next idea</h2>
        </div>
        <Link href="/collections" className="text-sm text-primary-text">
          All collections →
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {inspirationCollections.map((item) => (
          <Link key={item.mark} href={item.href} className="inspiration-tile">
            <span className="text-xs font-medium text-primary-text">{item.mark} / EXPLORE</span>
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
