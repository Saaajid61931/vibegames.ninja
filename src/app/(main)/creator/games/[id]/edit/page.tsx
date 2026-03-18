import { EditGamePageClient } from "@/components/creator/edit-game-page-client"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditGamePage({ params }: PageProps) {
  const { id } = await params

  return <EditGamePageClient gameId={id} />
}
