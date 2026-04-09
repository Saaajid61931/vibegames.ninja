import Link from "next/link"
import Image from "next/image"
import { unstable_cache } from "next/cache"
import { ArrowRight, Clock, Trophy, Vote, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import prisma, { isPrismaDatasourceConfigured } from "@/lib/prisma"
import { getLiveJamStatus } from "@/lib/jams"
import { isRenderableImageSrc } from "@/lib/image-src"
import { logServerError } from "@/lib/server-log"

function getStatusAccent(status: string) {
  switch (status) {
    case "ACTIVE":
      return {
        label: "GAME JAM LIVE",
        color: "text-[#00ff40]",
        icon: <Zap className="h-5 w-5 text-[#00ff40] animate-pulse" />,
      }
    case "VOTING":
      return {
        label: "VOTING OPEN",
        color: "text-[#ffff00]",
        icon: <Vote className="h-5 w-5 text-[#ffff00]" />,
      }
    case "UPCOMING":
      return {
        label: "COMING SOON",
        color: "text-[#00d4ff]",
        icon: <Clock className="h-5 w-5 text-[#00d4ff]" />,
      }
    default:
      return {
        label: "RESULTS LIVE",
        color: "text-[#b0b0d0]",
        icon: <Trophy className="h-5 w-5 text-[#b0b0d0]" />,
      }
  }
}

function getTimingCopy(jam: {
  startDate: Date
  endDate: Date
  votingEndDate: Date
}) {
  const liveStatus = getLiveJamStatus(jam)
  const now = Date.now()

  if (liveStatus === "ACTIVE") {
    const daysLeft = Math.max(0, Math.ceil((jam.endDate.getTime() - now) / (1000 * 60 * 60 * 24)))
    return `${daysLeft}d left to submit`
  }

  if (liveStatus === "VOTING") {
    return `Vote until ${jam.votingEndDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
  }

  if (liveStatus === "UPCOMING") {
    return `Starts ${jam.startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
  }

  return "See the final results"
}

const jamBannerSelect = {
  title: true,
  slug: true,
  theme: true,
  bannerImage: true,
  status: true,
  startDate: true,
  endDate: true,
  votingEndDate: true,
  _count: { select: { entries: true } },
} as const

const getFeaturedJam = unstable_cache(
  async () => {
    if (!isPrismaDatasourceConfigured()) {
      return null
    }

    try {
      const now = new Date()

      return (
        (await prisma.gameJam.findFirst({
          where: {
            startDate: { lte: now },
            endDate: { gt: now },
          },
          orderBy: { endDate: "asc" },
          select: jamBannerSelect,
        })) ||
        (await prisma.gameJam.findFirst({
          where: {
            endDate: { lte: now },
            votingEndDate: { gt: now },
          },
          orderBy: { votingEndDate: "asc" },
          select: jamBannerSelect,
        })) ||
        (await prisma.gameJam.findFirst({
          where: {
            startDate: { gt: now },
          },
          orderBy: { startDate: "asc" },
          select: jamBannerSelect,
        })) ||
        (await prisma.gameJam.findFirst({
          where: {
            votingEndDate: { lte: now },
          },
          orderBy: { votingEndDate: "desc" },
          select: jamBannerSelect,
        }))
      )
    } catch (error) {
      logServerError("Failed to render active jam banner", error, {
        route: "app/home",
        component: "ActiveJamBanner",
      })
      return null
    }
  },
  ["home-featured-jam"],
  { revalidate: 60, tags: ["jams"] }
)

export async function ActiveJamBanner() {
  const featuredJam = await getFeaturedJam()

  if (!featuredJam) {
    return null
  }

  const liveStatus = getLiveJamStatus(featuredJam)
  const accent = getStatusAccent(liveStatus)
  const bannerImage = isRenderableImageSrc(featuredJam.bannerImage) ? featuredJam.bannerImage : null
  const actionHref = liveStatus === "ACTIVE" ? `/upload?jam=${featuredJam.slug}` : `/jams/${featuredJam.slug}`
  const actionLabel =
    liveStatus === "ACTIVE"
      ? "Submit a Game"
      : liveStatus === "VOTING"
        ? "Vote Now"
        : liveStatus === "UPCOMING"
          ? "See Jam"
          : "See Results"

  return (
    <section className="border-b-2 border-[#4a4a6a] bg-[#11111d] py-4 sm:border-b-4 sm:py-6">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl space-y-4 border-2 border-[#4a4a6a] bg-[#1a1a2e] p-4 sm:p-5">
          <Link
            href={`/jams/${featuredJam.slug}`}
            prefetch={false}
            aria-label={`Open ${featuredJam.title} jam page`}
            className="group relative block aspect-[3/1] overflow-hidden border-2 border-[#4a4a6a] bg-[#0d0d15] transition-colors hover:border-[#ff0040] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff0040] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a2e]"
          >
            {bannerImage ? (
              <Image
                src={bannerImage}
                alt={featuredJam.title}
                fill
                sizes="(max-width: 1280px) 100vw, 1200px"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center">
                <div>
                  <p className="font-pixel text-[10px] text-[#ffff00]">GAME JAM</p>
                  <p className="mt-2 font-pixel text-sm text-white">{featuredJam.title}</p>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className={`inline-flex items-center gap-2 font-pixel text-[10px] sm:text-xs ${accent.color}`}>
                {accent.icon}
                <span>{accent.label}</span>
              </div>
              <div>
                <Link href={`/jams/${featuredJam.slug}`} className="group">
                  <h3 className="font-pixel text-sm text-white transition-colors group-hover:text-[#ff0040] sm:text-lg">
                    {featuredJam.title}
                  </h3>
                </Link>
                {featuredJam.theme ? (
                  <p className="mt-1 font-pixel text-[10px] text-[#ffff00] sm:text-xs">
                    THEME: {featuredJam.theme}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#d5d8e6] sm:text-xs">
                <span className="flex items-center gap-1">
                  <Trophy className="h-3.5 w-3.5" />
                  {featuredJam._count.entries} {featuredJam._count.entries === 1 ? "entry" : "entries"}
                </span>
                <span>{getTimingCopy(featuredJam)}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Button asChild variant="arcade" size="sm">
                <Link href={actionHref} prefetch={false}>
                  {actionLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="arcade-outline" size="sm">
                <Link href={`/jams/${featuredJam.slug}`} prefetch={false}>Open Jam</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
