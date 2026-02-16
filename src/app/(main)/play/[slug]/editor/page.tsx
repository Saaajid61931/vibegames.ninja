import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { LevelEditorShell } from "@/components/games/level-editor-shell"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ level?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const game = await prisma.game.findUnique({
    where: { slug },
    select: {
      title: true,
      status: true,
      hasLevelEditor: true,
    },
  })

  if (!game || game.status !== "PUBLISHED" || !game.hasLevelEditor) {
    return {
      title: "Level Editor",
      robots: { index: false, follow: false },
    }
  }

  return {
    title: `Level Editor - ${game.title}`,
    description: `Create and edit community levels for ${game.title}.`,
    alternates: {
      canonical: `/play/${slug}/editor`,
    },
    robots: { index: false, follow: false },
  }
}

export default async function PlayEditorPage({ params, searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const { slug } = await params
  const { level: levelId } = await searchParams

  const game = await prisma.game.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      gameUrl: true,
      status: true,
      hasLevelEditor: true,
    },
  })

  if (!game || game.status !== "PUBLISHED") {
    notFound()
  }

  if (!game.hasLevelEditor) {
    redirect(`/play/${slug}`)
  }

  const initialLevel = levelId
    ? await prisma.level.findUnique({
        where: { id: levelId },
        select: {
          id: true,
          name: true,
          description: true,
          data: true,
          creatorId: true,
        },
      })
    : null

  const editableLevel =
    initialLevel && initialLevel.creatorId === session.user.id
      ? {
          id: initialLevel.id,
          name: initialLevel.name,
          description: initialLevel.description,
          data: initialLevel.data,
        }
      : null

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d15]">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-4 sm:py-6">
        <Link href={`/play/${slug}`} className="inline-flex items-center gap-2 text-[#4a4a6a] hover:text-[#ffff00] mb-4 transition-colors font-arcade text-xs sm:text-sm">
          <ChevronLeft className="h-4 w-4" />
          BACK TO GAME
        </Link>

        <LevelEditorShell
          gameId={game.id}
          slug={game.slug}
          title={game.title}
          gameUrl={game.gameUrl}
          initialLevel={editableLevel}
        />
      </main>
      <Footer />
    </div>
  )
}
