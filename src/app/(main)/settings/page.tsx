import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Settings, Sparkles } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { AccountSettingsForm } from "@/components/account/account-settings-form"
import { PasswordSettingsForm } from "@/components/account/password-settings-form"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Account Settings",
  description: "Update your VibeGames display name and profile details.",
}

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/settings")}`)
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      username: true,
      image: true,
      bio: true,
      currentlyBuilding: true,
      password: true,
    },
  })

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/creator" className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                <Settings className="h-5 w-5 text-[var(--color-primary)]" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-[var(--color-text)]">Account Settings</h1>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  Update your display name, creator bio, and what you are building next.
                </p>
              </div>
            </div>
          </div>

          <Link href="/upload">
            <Button variant="outline" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Upload a game
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_320px]">
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">Public profile</h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                These details appear in your header menu, creator pages, and game listings.
              </p>
            </div>

            <AccountSettingsForm
              initialName={user.name || ""}
              initialBio={user.bio || ""}
              initialCurrentProject={user.currentlyBuilding || ""}
              initialImage={user.image || ""}
              email={user.email}
              username={user.username || null}
            />
          </section>

          <PasswordSettingsForm hasPassword={Boolean(user.password)} />

          <aside className="space-y-4">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <h3 className="text-sm font-semibold text-[var(--color-text)]">What you can change now</h3>
              <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-secondary)]">
                <li>- Display name shown across the site</li>
                <li>- Username and public creator link</li>
                <li>- Creator bio shown on public profile pages</li>
                <li>- Currently-building text for your portfolio header</li>
                <li>- Previous username URLs auto-redirect to your latest profile</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <h3 className="text-sm font-semibold text-[var(--color-text)]">Good next upgrades</h3>
              <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-secondary)]">
                <li>- Avatar crop support</li>
                <li>- Email change and verification</li>
                <li>- Account deletion and data export</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  )
}
