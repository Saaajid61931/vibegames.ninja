import Link from "next/link"
import { Gamepad2, Home, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export const metadata = {
  title: "404 - Page Not Found",
  description: "The page you are looking for does not exist.",
}

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Gamepad2 className="h-16 w-16 text-arcade-yellow mx-auto mb-6" />
          <h1 className="font-arcade text-3xl text-white mb-3">404</h1>
          <h2 className="font-arcade text-lg text-arcade-yellow mb-4">PAGE_NOT_FOUND</h2>
          <p className="font-arcade text-sm text-text-secondary mb-8">
            This page doesn&apos;t exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <Button variant="arcade" className="gap-2 font-arcade w-full sm:w-auto">
                <Home className="h-4 w-4" />
                HOME
              </Button>
            </Link>
            <Link href="/games">
              <Button variant="arcade-outline" className="gap-2 font-arcade w-full sm:w-auto">
                <Search className="h-4 w-4" />
                BROWSE GAMES
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
