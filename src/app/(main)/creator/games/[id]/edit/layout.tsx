import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Edit Game",
  description: "Update your game details, files, and settings on VibeGames.",
}

export default function EditGameLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
