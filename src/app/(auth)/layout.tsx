import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    default: "Sign In",
    template: "%s | VibeGames.ai",
  },
  description: "Sign in or create an account on VibeGames.ai to publish and play AI-made games.",
  robots: { index: false },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
