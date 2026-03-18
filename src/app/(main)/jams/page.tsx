import { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { JamsList } from "@/components/jams/jams-list"
import { Trophy } from "lucide-react"
import { listJamGroupsForPage } from "@/lib/jam-page-data"
import { SITE_NAME, SITE_URL } from "@/lib/site"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Game Jams | VibeGames.Ninja",
  description: "Compete in AI game jams. Build games around a theme, get votes from the community, and win bragging rights.",
  alternates: {
    canonical: "/jams",
  },
  openGraph: {
    title: `Game Jams | ${SITE_NAME}`,
    description: "Compete in AI game jams, submit your best builds, and discover new creators.",
    url: `${SITE_URL}/jams`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Game Jams | ${SITE_NAME}`,
    description: "Compete in AI game jams, submit your best builds, and discover new creators.",
  },
}

export default async function JamsPage() {
  const groups = await listJamGroupsForPage()

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d15]">
      <Header />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Hero */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-3 mb-4">
              <Trophy className="w-8 h-8 text-[#ffff00]" />
              <h1 className="text-2xl md:text-3xl font-pixel text-[#ffff00]">GAME JAMS</h1>
              <Trophy className="w-8 h-8 text-[#ffff00]" />
            </div>
            <p className="text-[#b0b0d0] max-w-xl mx-auto">
              Build an AI game around a theme. Compete with the community. Vote on your favorites.
            </p>
          </div>

          <JamsList groups={groups} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
