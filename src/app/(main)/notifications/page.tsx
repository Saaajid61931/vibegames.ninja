import Link from "next/link"
import { redirect } from "next/navigation"
import { Bell, ChevronLeft } from "lucide-react"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { timeAgo } from "@/lib/utils"

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
  })

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
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

        {notifications.length === 0 ? (
          <div className="rounded-lg border border-[#2e3446] bg-[#111626] p-8 text-center">
            <p className="font-arcade text-white">No notifications yet.</p>
            <p className="mt-2 text-sm font-arcade text-[#4a4a6a]">Follows, comments, and ratings will show up here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const content = (
                <div className={`border px-4 py-3 ${notification.read ? "border-[#2e3446] bg-[#111626]" : "border-[#ffff00]/40 bg-[#1a1a2e]"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-arcade text-sm text-white">{notification.title}</p>
                      <p className="mt-1 font-arcade text-sm text-[#8b93a6]">{notification.message}</p>
                    </div>
                    {!notification.read && <span className="font-arcade text-[10px] text-[#ffff00]">NEW</span>}
                  </div>
                  <p className="mt-2 font-arcade text-[10px] text-[#4a4a6a]">{timeAgo(new Date(notification.createdAt))}</p>
                </div>
              )

              return notification.link ? (
                <Link key={notification.id} href={notification.link} className="block hover:opacity-95 transition-opacity">
                  {content}
                </Link>
              ) : (
                <div key={notification.id}>{content}</div>
              )
            })}
          </div>
        )}

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
