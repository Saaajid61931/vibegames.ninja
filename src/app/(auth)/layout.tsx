import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    default: "Sign In",
    template: "%s | VibeGames.Ninja",
  },
  description: "Sign in or create an account on VibeGames.Ninja to publish and play AI-made games.",
  robots: { index: false },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
