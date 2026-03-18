import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { generatePlayPageMetadata, getPlayPageData } from "@/lib/play-page-data"
import { PlayPageView } from "@/components/games/play-page-view"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ level?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  return generatePlayPageMetadata(slug)
}

export default async function PlayPage({ params, searchParams }: PageProps) {
  const session = await auth()
  const { slug } = await params
  const { level: selectedLevelId } = await searchParams
  const data = await getPlayPageData(slug, selectedLevelId, session?.user?.id)

  if (!data) {
    notFound()
  }

  return (
    <PlayPageView
      data={data}
      selectedLevelId={selectedLevelId}
      userId={session?.user?.id ?? null}
    />
  )
}
