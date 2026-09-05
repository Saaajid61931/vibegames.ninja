import type { Metadata } from "next"
import { getHomePageData } from "@/lib/home-page-data"
import { MobileReelsFeed } from "@/components/home/mobile-reels-feed"
export const metadata: Metadata = { title: "Quick play — find your next surprise" }
export const revalidate = 60
export default async function QuickPlayPage() {
  const data = await getHomePageData()
  return (
    <main className="mx-auto h-[100dvh] max-w-2xl overflow-hidden bg-canvas">
      <MobileReelsFeed
        games={data.allMobileGames}
        backgroundGames={data.heroGames}
        stats={data.stats}
      />
    </main>
  )
}
