import { redirect } from "next/navigation"
import Link from "next/link"
import { 
  Shield, 
  Gamepad2, 
  Users, 
  Flag,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertTriangle
} from "lucide-react"
import { auth } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import prisma from "@/lib/prisma"
import { formatNumber, timeAgo } from "@/lib/utils"

export const dynamic = "force-dynamic"

async function getAdminData() {
  const [
    pendingGames,
    reports,
    totalUsers,
    totalGames,
    totalPlays,
  ] = await Promise.all([
    prisma.game.findMany({
      where: { status: "PENDING" },
      include: {
        creator: { select: { name: true, username: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.report.findMany({
      where: { status: "PENDING" },
      include: {
        game: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.count(),
    prisma.game.count(),
    prisma.game.aggregate({ _sum: { plays: true } }),
  ])

  return {
    pendingGames,
    reports,
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

  const { pendingGames, reports, stats } = await getAdminData()

  const statCards = [
    { title: "Total Users", value: formatNumber(stats.totalUsers), icon: Users },
    { title: "Total Games", value: formatNumber(stats.totalGames), icon: Gamepad2 },
    { title: "Total Plays", value: formatNumber(stats.totalPlays), icon: Eye },
    { title: "Pending Reviews", value: stats.pendingReviews, icon: Clock, alert: stats.pendingReviews > 0 },
    { title: "Pending Reports", value: stats.pendingReports, icon: Flag, alert: stats.pendingReports > 0 },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d15]">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3 font-pixel">
            <Shield className="h-8 w-8 text-[#ff0040]" />
            Admin Panel
          </h1>
          <p className="text-[#4a4a6a] mt-2 font-arcade text-base sm:text-lg">Manage games, users, and reports</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className={stat.alert ? "border-[#ffff00]" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${stat.alert ? "text-[#ffff00]" : "text-[#4a4a6a]"}`} />
                    <div>
                      <p className="text-xs text-[#4a4a6a] font-pixel">{stat.title}</p>
                      <p className={`text-xl font-bold ${stat.alert ? "text-[#ffff00]" : "text-white"}`}>
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
                        className="flex flex-col sm:flex-row sm:items-center gap-4 border-2 border-[#4a4a6a] bg-[#1a1a2e] p-4"
                      >
                        <div className="w-full sm:w-24 h-32 sm:h-14 bg-[#0d0d15] border-2 border-[#4a4a6a] overflow-hidden flex-shrink-0">
                          {game.thumbnail ? (
                            <img src={game.thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Gamepad2 className="h-6 w-6 text-[#4a4a6a]" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 w-full">
                          <h3 className="font-medium text-white truncate font-pixel text-xs">{game.title}</h3>
                          <p className="text-sm sm:text-base text-[#4a4a6a] font-arcade break-words">
                            by {game.creator.name || game.creator.username} ({game.creator.email})
                          </p>
                          <p className="text-xs text-[#4a4a6a] font-pixel">{timeAgo(new Date(game.createdAt))}</p>
                        </div>
                        <div className="flex w-full sm:w-auto flex-wrap sm:flex-nowrap items-center gap-2 justify-end">
                          <Link href={`/play/${game.slug}`} target="_blank">
                            <Button variant="ghost" size="sm" className="gap-1">
                              <Eye className="h-4 w-4" />
                              Preview
                            </Button>
                          </Link>
                          <form action={`/api/admin/games/${game.id}/approve`} method="POST">
                            <Button type="submit" size="sm" variant="success" className="gap-1">
                              <CheckCircle className="h-4 w-4" />
                              Approve
                            </Button>
                          </form>
                          <form action={`/api/admin/games/${game.id}/reject`} method="POST">
                            <Button type="submit" size="sm" variant="destructive" className="gap-1">
                              <XCircle className="h-4 w-4" />
                              Reject
                            </Button>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-[#4a4a6a] font-arcade text-lg">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-[#00ff40]" />
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
                        className="flex flex-col sm:flex-row sm:items-center gap-4 border-2 border-[#4a4a6a] bg-[#1a1a2e] p-4"
                      >
                        <AlertTriangle className="h-8 w-8 text-[#ffff00] flex-shrink-0" />
                        <div className="flex-1 w-full">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-white font-pixel text-xs">{report.game.title}</h3>
                            <Badge variant="warning">{report.reason}</Badge>
                          </div>
                          {report.description && (
                            <p className="text-sm sm:text-base text-[#4a4a6a] font-arcade break-words">{report.description}</p>
                          )}
                          <p className="text-xs text-[#4a4a6a] font-pixel">{timeAgo(new Date(report.createdAt))}</p>
                        </div>
                        <div className="flex w-full sm:w-auto flex-wrap sm:flex-nowrap items-center gap-2 justify-end">
                          <Link href={`/play/${report.game.slug}`} target="_blank">
                            <Button variant="ghost" size="sm">Review</Button>
                          </Link>
                          <form action={`/api/admin/reports/${report.id}/take-action`} method="POST">
                            <Button type="submit" size="sm" variant="destructive">Suspend</Button>
                          </form>
                          <form action={`/api/admin/reports/${report.id}/dismiss`} method="POST">
                            <Button type="submit" size="sm" variant="outline">Dismiss</Button>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-[#4a4a6a] font-arcade text-lg">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-[#00ff40]" />
                    <p>No pending reports.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  )
}
