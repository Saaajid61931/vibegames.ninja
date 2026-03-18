import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Create Games",
  description: "Start from a VibeGames game template, prompt it into shape, and publish when the run feels ready.",
}

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
