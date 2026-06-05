import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { generatePlayPageMetadata, getPlayPageData } from "@/lib/play-page-data"
import { PlayPageView } from "@/components/games/play-page-view"
import { logServerError } from "@/lib/server-log"

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
  const { slug } = await params
  const { level: selectedLevelId } = await searchParams
  let session: { user?: { id?: string | null; role?: string | null } } | null = null

  try {
    session = await auth()
  } catch (error) {
    logServerError("Play page auth lookup failed", error, {
      route: "app/play/[slug]",
      slug,
    })
  }

  let data: Awaited<ReturnType<typeof getPlayPageData>> | null = null

  try {
    data = await getPlayPageData(slug, selectedLevelId, session?.user?.id)
  } catch (error) {
    logServerError("Play page data load failed", error, {
      route: "app/play/[slug]",
      slug,
      level: selectedLevelId || null,
      userId: session?.user?.id ?? null,
    })

    if (session?.user?.id) {
      data = await getPlayPageData(slug, selectedLevelId, null)
    } else {
      throw error
    }
  }

  if (!data) {
    notFound()
  }

  return (
    <PlayPageView
      data={data}
      selectedLevelId={selectedLevelId}
      userId={session?.user?.id ?? null}
      userRole={session?.user?.role ?? null}
    />
  )
}
