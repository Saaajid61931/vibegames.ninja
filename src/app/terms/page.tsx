import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Review the VibeGames.ai terms for creators and players using the platform.",
  alternates: {
    canonical: "/terms",
  },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0d0d15]">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <h1 className="font-pixel text-2xl text-white">Terms of Service</h1>
        <div className="mt-6 space-y-4 text-lg text-[#4a4a6a] font-arcade">
          <p>By using VibeGames.ai, you agree to upload only content you own or have rights to use.</p>
          <p>You are responsible for your game content, metadata, and external assets.</p>
          <p>We may remove or suspend content that violates platform rules, law, or safety policies.</p>
          <p>Community content and levels are subject to platform moderation policies.</p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
