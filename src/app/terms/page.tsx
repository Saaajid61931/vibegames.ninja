import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Review the VibeGames.Ninja terms for creators and players using the platform.",
  alternates: {
    canonical: "/terms",
  },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <h1 className="heading-pixel-lg text-white">Terms of Service</h1>
        <div className="mt-6 space-y-4 text-lg text-text-secondary font-arcade">
          <p>By using VibeGames.Ninja, you agree to upload only content you own or have rights to use.</p>
          <p>You are responsible for your game content, metadata, and external assets.</p>
          <p>We may remove or suspend content that violates platform rules, law, or safety policies.</p>
          <p>Community content and levels are subject to platform moderation policies.</p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
