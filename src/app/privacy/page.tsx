import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0d0d15]">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <h1 className="font-pixel text-2xl text-white">Privacy Policy</h1>
        <div className="mt-6 space-y-4 text-lg text-[#4a4a6a] font-arcade">
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
