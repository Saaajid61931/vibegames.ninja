import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read how VibeGames.Ninja handles account data, analytics, and privacy requests.",
  alternates: {
    canonical: "/privacy",
  },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <h1 className="heading-pixel-lg text-white">Privacy Policy</h1>
        <div className="mt-6 space-y-4 text-lg text-text-secondary font-arcade">
          <p>We store account data needed to authenticate users and provide creator features.</p>
          <p>Gameplay analytics are aggregated to improve discovery and creator insights.</p>
          <p>We do not sell personal account information to third parties.</p>
          <p>You can request account deletion by contacting support from your registered email.</p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
