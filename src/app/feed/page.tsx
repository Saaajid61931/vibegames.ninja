import type { Metadata } from "next"
import { getHomePageData } from "@/lib/home-page-data"
import { SITE_NAME, SITE_URL } from "@/lib/site"
import { MobileReelsFeed } from "@/components/home/mobile-reels-feed"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Reels Feed - VibeGames.Ninja",
  description: "Experience quick-play AI games in a full-screen vertical feed.",
  alternates: {
    canonical: "/feed",
  },
  openGraph: {
    title: `Reels Feed - ${SITE_NAME}`,
    description: "Experience quick-play AI games in a full-screen vertical feed.",
    url: `${SITE_URL}/feed`,
    type: "website",
  },
}

export default async function FeedPage() {
  const { allMobileGames } = await getHomePageData()

  return (
    <main className="h-[100dvh] w-full bg-[#0d0d15] overflow-hidden">
      <MobileReelsFeed games={allMobileGames} />
    </main>
  )
}
