import Link from "next/link"
import { Trophy, Zap, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import prisma from "@/lib/prisma"

export async function ActiveJamBanner() {
  // Find the most relevant active or upcoming jam
  const now = new Date()

  // Auto-transition
  await prisma.gameJam.updateMany({
    where: { status: "UPCOMING", startDate: { lte: now } },
    data: { status: "ACTIVE" },
  })

  const activeJam = await prisma.gameJam.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { endDate: "asc" },
    select: {
      title: true,
      slug: true,
      theme: true,
      endDate: true,
      _count: { select: { entries: true } },
    },
  })

  if (!activeJam) return null

  const daysLeft = Math.max(
    0,
    Math.ceil((activeJam.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  )

  return (
    <section className="border-b-2 sm:border-b-4 border-[#4a4a6a]">
      <Link href={`/jams/${activeJam.slug}`} className="block group">
        <div className="bg-gradient-to-r from-[#1a1a2e] via-[#2a1a3e] to-[#1a1a2e] py-4 sm:py-5">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#00ff40] animate-pulse" />
                <span className="font-pixel text-[10px] sm:text-xs text-[#00ff40]">GAME JAM LIVE</span>
              </div>

              <div className="text-center">
                <h3 className="font-pixel text-xs sm:text-sm text-white group-hover:text-[#ff0040] transition-colors">
                  {activeJam.title}
                </h3>
                {activeJam.theme && (
                  <p className="text-[10px] text-[#ffff00] font-pixel mt-0.5">
                    THEME: {activeJam.theme}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4 text-[10px] sm:text-xs text-[#8080a0]">
                <span className="flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  {activeJam._count.entries} entries
                </span>
                <span className="text-[#ff0040] font-pixel">
                  {daysLeft}d LEFT
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="border-[#00ff40] text-[#00ff40] hover:bg-[#00ff40] hover:text-black font-pixel text-[10px] gap-1 h-7"
              >
                JOIN
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </section>
  )
}
