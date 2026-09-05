import type { ReactNode } from "react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
export function CommunityShell({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-canvas">
      <Header />
      <main id="main-content" className="container mx-auto px-4 py-8">
        <div className="mb-7 border-b-2 border-border-strong pb-6">
          <h1 className="heading-pixel-lg text-white">{title}</h1>
          {description && (
            <p className="mt-3 max-w-2xl font-arcade leading-7 text-text-secondary">{description}</p>
          )}
        </div>
        <nav aria-label="Your community" className="mb-7 flex flex-wrap gap-3 text-sm">
          <Link className="community-button" href="/collections">
            Collections
          </Link>
          <Link className="community-button" href="/favorites">
            Saved games
          </Link>
          <Link className="community-button" href="/library">
            Your projects
          </Link>
          <Link className="community-button" href="/creator/projects">
            Creator workspace
          </Link>
        </nav>
        {children}
      </main>
      <Footer />
    </div>
  )
}
