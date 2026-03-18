import Link from "next/link"
import { redirect } from "next/navigation"
import { Bell, ChevronLeft } from "lucide-react"
import { auth } from "@/lib/auth"
import { NotificationsPageClient } from "@/components/layout/notifications-page-client"
import prisma from "@/lib/prisma"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Notifications",
  description: "Activity updates for your VibeGames account.",
}

export default async function NotificationsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/notifications")}`)
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      message: true,
      link: true,
      read: true,
      createdAt: true,
    },
  })

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d15]">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        <Link href="/creator" className="inline-flex items-center gap-2 text-[#4a4a6a] hover:text-[#ffff00] mb-6 transition-colors font-arcade text-sm">
          <ChevronLeft className="h-4 w-4" />
          BACK TO DASHBOARD
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <Bell className="h-6 w-6 text-[#ffff00]" />
          <div>
            <h1 className="text-2xl font-semibold text-white font-arcade">Notifications</h1>
            <p className="text-sm text-[#4a4a6a] font-arcade">Recent activity across your games and profile.</p>
          </div>
        </div>

        <NotificationsPageClient
          initialNotifications={notifications.map((notification) => ({
            ...notification,
            createdAt: notification.createdAt.toISOString(),
          }))}
        />

        <div className="mt-6">
          <Button asChild variant="outline">
            <Link href="/games">Browse Games</Link>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  )
}
