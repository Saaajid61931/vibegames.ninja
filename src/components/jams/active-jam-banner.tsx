import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Clock, Trophy, Vote, Zap } from "lucide-react"
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import prisma from "@/lib/prisma"
import { getJamAction, getLiveJamStatus } from "@/lib/jams"

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

export async function ActiveJamBanner() {
  const session = await auth()
  const now = new Date()

  const featuredJam =
    (await prisma.gameJam.findFirst({
      where: {
        startDate: { lte: now },
        endDate: { gt: now },
      },
      orderBy: { endDate: "asc" },
      select: {
        title: true,
        slug: true,
        theme: true,
        bannerImage: true,
        status: true,
        startDate: true,
        endDate: true,
        votingEndDate: true,
        _count: { select: { entries: true } },
      },
    })) ||
    (await prisma.gameJam.findFirst({
      where: {
        endDate: { lte: now },
        votingEndDate: { gt: now },
      },
      orderBy: { votingEndDate: "asc" },
      select: {
        title: true,
        slug: true,
        theme: true,
        bannerImage: true,
        status: true,
        startDate: true,
        endDate: true,
        votingEndDate: true,
        _count: { select: { entries: true } },
      },
    })) ||
    (await prisma.gameJam.findFirst({
      where: {
        startDate: { gt: now },
      },
      orderBy: { startDate: "asc" },
      select: {
        title: true,
        slug: true,
        theme: true,
        bannerImage: true,
        status: true,
        startDate: true,
        endDate: true,
        votingEndDate: true,
        _count: { select: { entries: true } },
      },
    })) ||
    (await prisma.gameJam.findFirst({
      where: {
        votingEndDate: { lte: now },
      },
      orderBy: { votingEndDate: "desc" },
      select: {
        title: true,
        slug: true,
        theme: true,
        bannerImage: true,
        status: true,
        startDate: true,
        endDate: true,
        votingEndDate: true,
        _count: { select: { entries: true } },
      },
    }))

  if (!featuredJam) {
    return null
  }

  const liveStatus = getLiveJamStatus(featuredJam)
  const accent = getStatusAccent(liveStatus)
  const action = getJamAction(featuredJam, {
    surface: "banner",
    isAuthenticated: Boolean(session?.user?.id),
  })

  return (
    <section className="border-b-2 border-[#4a4a6a] sm:border-b-4">
      <div className="relative overflow-hidden">
        {featuredJam.bannerImage ? (
          <Image
            src={featuredJam.bannerImage}
            alt=""
            aria-hidden="true"
            fill
            sizes="100vw"
            className="object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-[#0d0d15]/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d15] via-[#0d0d15]/65 to-[#0d0d15]" />

        <div className="relative container mx-auto px-4 py-6 sm:py-8">
          <div className="grid gap-5 lg:grid-cols-[1.3fr_auto] lg:items-center">
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
                {featuredJam.theme && (
                  <p className="mt-1 font-pixel text-[10px] text-[#ffff00] sm:text-xs">
                    THEME: {featuredJam.theme}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#d5d8e6] sm:text-xs">
                <span className="flex items-center gap-1">
                  <Trophy className="h-3.5 w-3.5" />
                  {featuredJam._count.entries} {featuredJam._count.entries === 1 ? "entry" : "entries"}
                </span>
                <span>{getTimingCopy(featuredJam)}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="arcade">
                <Link href={action.href}>
                  {action.label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="arcade-outline">
                <Link href={`/jams/${featuredJam.slug}`}>Open Jam</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
