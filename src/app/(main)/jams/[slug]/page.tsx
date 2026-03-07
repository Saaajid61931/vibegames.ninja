import { Metadata } from "next"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { JamDetail } from "@/components/jams/jam-detail"
import { SITE_NAME, SITE_URL } from "@/lib/site"

export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const jam = await prisma.gameJam.findUnique({
    where: { slug },
    select: { title: true, description: true, theme: true },
  })

  if (!jam) return { title: "Jam Not Found" }

  const jamPath = `/jams/${slug}`
  const description = jam.description.slice(0, 160)

  return {
    title: `${jam.title} | Game Jams | VibeGames.Ninja`,
    description,
    alternates: {
      canonical: jamPath,
    },
    openGraph: {
      title: `${jam.title} | ${SITE_NAME}`,
      description,
      url: `${SITE_URL}${jamPath}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${jam.title} | ${SITE_NAME}`,
      description,
    },
  }
}

async function getJamData(slug: string) {
  const now = new Date()

  // Auto-transition
  await prisma.gameJam.updateMany({
    where: { status: "UPCOMING", startDate: { lte: now } },
    data: { status: "ACTIVE" },
  })
  await prisma.gameJam.updateMany({
    where: { status: "ACTIVE", endDate: { lte: now } },
    data: { status: "VOTING" },
  })
  await prisma.gameJam.updateMany({
    where: { status: "VOTING", votingEndDate: { lte: now } },
    data: { status: "COMPLETED" },
  })

  const jam = await prisma.gameJam.findUnique({
    where: { slug },
    include: {
      createdBy: { select: { id: true, name: true, username: true } },
      entries: {
        include: {
          game: {
            select: {
              id: true,
              slug: true,
              title: true,
              thumbnail: true,
              plays: true,
              category: true,
              createdAt: true,
            },
          },
          user: {
            select: { id: true, name: true, username: true, image: true },
          },
          votes: {
            select: { score: true, userId: true },
          },
        },
        orderBy: { submittedAt: "asc" },
      },
    },
  })

  return jam
}

export default async function JamDetailPage({ params }: Props) {
  const { slug } = await params
  const jam = await getJamData(slug)

  if (!jam) {
    notFound()
  }

  const session = await auth()

  // Get user's published games for submission
  let userGames: { id: string; title: string; slug: string }[] = []
  if (session?.user?.id && jam.status === "ACTIVE") {
    userGames = await prisma.game.findMany({
      where: { creatorId: session.user.id, status: "PUBLISHED" },
      select: { id: true, title: true, slug: true },
      orderBy: { title: "asc" },
    })
  }

  // Calculate scores and serialize dates
  const entriesWithScores = jam.entries.map((entry) => {
    const totalScore = entry.votes.reduce((sum, v) => sum + v.score, 0)
    const voteCount = entry.votes.length
    const userVote = session?.user?.id
      ? entry.votes.find((v) => v.userId === session.user!.id)?.score ?? null
      : null

    return {
      id: entry.id,
      game: {
        ...entry.game,
        createdAt: entry.game.createdAt.toISOString(),
      },
      user: entry.user,
      submittedAt: entry.submittedAt.toISOString(),
      avgScore: voteCount > 0 ? totalScore / voteCount : 0,
      voteCount,
      userVote,
    }
  })

  // Sort by score for voting/completed
  if (jam.status === "COMPLETED" || jam.status === "VOTING") {
    entriesWithScores.sort((a, b) => b.avgScore - a.avgScore)
  }

  const serializedJam = {
    id: jam.id,
    title: jam.title,
    slug: jam.slug,
    description: jam.description,
    theme: jam.theme,
    rules: jam.rules,
    bannerImage: jam.bannerImage,
    status: jam.status,
    startDate: jam.startDate.toISOString(),
    endDate: jam.endDate.toISOString(),
    votingEndDate: jam.votingEndDate.toISOString(),
    maxEntries: jam.maxEntries,
    createdBy: jam.createdBy,
    entries: entriesWithScores,
  }

  const jamJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: jam.title,
    description: jam.description,
    eventStatus:
      jam.status === "COMPLETED"
        ? "https://schema.org/EventCompleted"
        : jam.status === "UPCOMING"
          ? "https://schema.org/EventScheduled"
          : "https://schema.org/EventInProgress",
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    startDate: jam.startDate.toISOString(),
    endDate: jam.votingEndDate.toISOString(),
    organizer: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    url: `${SITE_URL}/jams/${jam.slug}`,
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d15]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jamJsonLd) }} />
      <Header />
      <main className="flex-1">
        <JamDetail
          jam={serializedJam}
          userId={session?.user?.id ?? null}
          userGames={userGames}
        />
      </main>
      <Footer />
    </div>
  )
}
