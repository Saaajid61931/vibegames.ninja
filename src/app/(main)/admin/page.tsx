import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { 
  Shield, 
  Gamepad2, 
  Users, 
  Flag,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertTriangle,
  Crown,
  Trophy
} from "lucide-react"
import { auth } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FeaturedManager } from "@/components/admin/featured-manager"
import { JamManager } from "@/components/admin/jam-manager"
import { AdminActionButton } from "@/components/admin/admin-action-button"
import { getLiveJamStatus } from "@/lib/jams"
import prisma from "@/lib/prisma"
import { formatNumber, timeAgo } from "@/lib/utils"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Admin Panel",
  description: "Manage games, users, and reports on VibeGames.",
}

async function getAdminData() {
  const [
    pendingGames,
    reports,
    totalUsers,
    totalGames,
    totalPlays,
    jams,
  ] = await Promise.all([
    prisma.game.findMany({
      where: { status: "PENDING" },
      include: {
        creator: { select: { name: true, username: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.report.findMany({
      where: {
        status: "PENDING",
        reason: { notIn: ["BUG", "IDEA"] },
      },
      include: {
        game: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.count(),
    prisma.game.count(),
    prisma.game.aggregate({ _sum: { plays: true } }),
    prisma.gameJam.findMany({
      orderBy: { startDate: "desc" },
      include: { _count: { select: { entries: true } } },
    }),
  ])

  return {
    pendingGames,
    reports,
    jams: jams.map((j) => ({
      id: j.id,
      title: j.title,
      slug: j.slug,
      description: j.description,
      status: getLiveJamStatus(j),
      theme: j.theme,
      rules: j.rules,
      bannerImage: j.bannerImage,
      startDate: j.startDate.toISOString(),
      endDate: j.endDate.toISOString(),
      votingEndDate: j.votingEndDate.toISOString(),
      maxEntries: j.maxEntries,
      entryCount: j._count.entries,
    })),
    stats: {
      totalUsers,
      totalGames,
      totalPlays: totalPlays._sum.plays || 0,
      pendingReviews: pendingGames.length,
      pendingReports: reports.length,
    },
  }
}

export default async function AdminPage() {
  const session = await auth()
  
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/")
  }

  const { pendingGames, reports, jams, stats } = await getAdminData()

  const statCards = [
    { title: "Total Users", value: formatNumber(stats.totalUsers), icon: Users },
    { title: "Total Games", value: formatNumber(stats.totalGames), icon: Gamepad2 },
    { title: "Total Plays", value: formatNumber(stats.totalPlays), icon: Eye },
    { title: "Pending Reviews", value: stats.pendingReviews, icon: Clock, alert: stats.pendingReviews > 0 },
    { title: "Pending Reports", value: stats.pendingReports, icon: Flag, alert: stats.pendingReports > 0 },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-8">
          <h1 className="heading-pixel-lg flex items-center gap-3 font-bold text-white">
            <Shield className="h-8 w-8 text-arcade-red" />
            Admin Panel
          </h1>
          <p className="text-text-secondary mt-2 font-arcade text-base sm:text-lg">Manage games, users, and reports</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className={stat.alert ? "border-arcade-yellow" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${stat.alert ? "text-arcade-yellow" : "text-text-secondary"}`} />
                    <div>
                      <p className="text-kicker text-text-secondary">{stat.title}</p>
                      <p className={`text-xl font-bold ${stat.alert ? "text-arcade-yellow" : "text-white"}`}>
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="w-full h-auto flex-wrap justify-start">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending Games ({pendingGames.length})
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <Flag className="h-4 w-4" />
              Reports ({reports.length})
            </TabsTrigger>
            <TabsTrigger value="featured" className="gap-2">
              <Crown className="h-4 w-4" />
              Game of the Month
            </TabsTrigger>
            <TabsTrigger value="jams" className="gap-2">
              <Trophy className="h-4 w-4" />
              Game Jams
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Games Pending Review</CardTitle>
                <CardDescription>Review and approve or reject submitted games</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingGames.length > 0 ? (
                  <div className="space-y-4">
                    {pendingGames.map((game) => (
                      <div
                        key={game.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-4 border-2 border-border-strong bg-surface-2 p-4"
                      >
                        <div className="w-full sm:w-24 h-32 sm:h-14 bg-canvas border-2 border-border-strong overflow-hidden flex-shrink-0">
                          {game.thumbnail ? (
                            <Image
                              src={game.thumbnail}
                              alt={game.title}
                              width={96}
                              height={128}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Gamepad2 className="h-6 w-6 text-text-secondary" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 w-full">
                          <h3 className="heading-pixel-sm truncate font-medium text-white">{game.title}</h3>
                          <p className="text-sm sm:text-base text-text-secondary font-arcade break-words">
                            by {game.creator.name || game.creator.username} ({game.creator.email})
                          </p>
                          <p className="text-xs text-text-secondary">{timeAgo(new Date(game.createdAt))}</p>
                        </div>
                        <div className="flex w-full sm:w-auto flex-wrap sm:flex-nowrap items-center gap-2 justify-end">
                          <Link href={`/play/${game.slug}`} target="_blank">
                            <Button variant="ghost" size="sm" className="gap-1">
                              <Eye className="h-4 w-4" />
                              Preview
                            </Button>
                          </Link>
                          <AdminActionButton
                            action={`/api/admin/games/${game.id}/approve`}
                            size="sm"
                            variant="success"
                            className="gap-1"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Approve
                          </AdminActionButton>
                          <AdminActionButton
                            action={`/api/admin/games/${game.id}/reject`}
                            size="sm"
                            variant="destructive"
                            className="gap-1"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </AdminActionButton>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-text-secondary font-arcade text-lg">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-arcade-green" />
                    <p>All caught up! No games pending review.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Reported Content</CardTitle>
                <CardDescription>Review and resolve user reports</CardDescription>
              </CardHeader>
              <CardContent>
                {reports.length > 0 ? (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-4 border-2 border-border-strong bg-surface-2 p-4"
                      >
                        <AlertTriangle className="h-8 w-8 text-arcade-yellow flex-shrink-0" />
                        <div className="flex-1 w-full">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="heading-pixel-sm font-medium text-white">{report.game.title}</h3>
                            <Badge variant="warning">{report.reason}</Badge>
                          </div>
                          {report.description && (
                            <p className="text-sm sm:text-base text-text-secondary font-arcade break-words">{report.description}</p>
                          )}
                          <p className="text-xs text-text-secondary">{timeAgo(new Date(report.createdAt))}</p>
                        </div>
                        <div className="flex w-full sm:w-auto flex-wrap sm:flex-nowrap items-center gap-2 justify-end">
                          <Link href={`/play/${report.game.slug}`} target="_blank">
                            <Button variant="ghost" size="sm">Review</Button>
                          </Link>
                          <AdminActionButton
                            action={`/api/admin/reports/${report.id}/take-action`}
                            size="sm"
                            variant="destructive"
                          >
                            Suspend
                          </AdminActionButton>
                          <AdminActionButton
                            action={`/api/admin/reports/${report.id}/dismiss`}
                            size="sm"
                            variant="outline"
                          >
                            Dismiss
                          </AdminActionButton>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-text-secondary font-arcade text-lg">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-arcade-green" />
                    <p>No pending reports.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="featured">
            <Card>
              <CardHeader>
                <CardTitle>Game of the Month</CardTitle>
                <CardDescription>
                  The game with the most stars this month is automatically featured on the homepage. You can also manually override the pick below.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FeaturedManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jams">
            <Card>
              <CardHeader>
                <CardTitle>Game Jams</CardTitle>
                <CardDescription>
                  Create and manage game jams. Theme, banner, rules, submission window, voting window, and entry limits are all controlled here. Status still auto-transitions from the jam dates.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <JamManager initialJams={jams} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  )
}
