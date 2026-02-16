import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Upload Game",
  description: "Upload your AI-made HTML5 game to VibeGames and share it with the world.",
}

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
