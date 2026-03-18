"use client"

import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Calendar, Users, Clock, Trophy, Zap, Vote } from "lucide-react"

type JamSummary = {
  id: string
  title: string
  slug: string
  description: string
  theme: string | null
  bannerImage: string | null
  status: string
  startDate: string | Date
  endDate: string | Date
  votingEndDate: string | Date
  _count: { entries: number }
}

type JamsGroups = {
  active: JamSummary[]
  upcoming: JamSummary[]
  voting: JamSummary[]
  completed: JamSummary[]
}

function statusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return <Badge className="bg-[#00ff40]/20 text-[#00ff40] border-[#00ff40]/30 font-pixel text-[10px]"><Zap className="w-3 h-3 mr-1" />LIVE</Badge>
    case "UPCOMING":
      return <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 font-pixel text-[10px]"><Clock className="w-3 h-3 mr-1" />UPCOMING</Badge>
    case "VOTING":
      return <Badge className="bg-[#ffff00]/20 text-[#ffff00] border-[#ffff00]/30 font-pixel text-[10px]"><Vote className="w-3 h-3 mr-1" />VOTING</Badge>
    case "COMPLETED":
      return <Badge className="bg-[#b0b0d0]/20 text-[#b0b0d0] border-[#b0b0d0]/30 font-pixel text-[10px]"><Trophy className="w-3 h-3 mr-1" />COMPLETED</Badge>
    default:
      return null
  }
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function timeUntil(date: string | Date) {
  const target = new Date(date).getTime()
  const now = Date.now()
  const diff = target - now
  if (diff <= 0) return "now"

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 0) return `${days}d ${hours}h`
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${mins}m`
}

function JamCard({ jam }: { jam: JamSummary }) {
  return (
    <Link href={`/jams/${jam.slug}`}>
      <Card className="bg-[#1a1a2e] border-[#2a2a4a] hover:border-[#ff0040] transition-all duration-200 overflow-hidden group cursor-pointer">
        {jam.bannerImage && (
          <div className="aspect-[3/1] overflow-hidden">
            <Image
              src={jam.bannerImage}
              alt={`${jam.title} banner`}
              width={960}
              height={320}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
        )}
        <div className="p-5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-pixel text-sm text-white group-hover:text-[#ff0040] transition-colors leading-relaxed">
              {jam.title}
            </h3>
            {statusBadge(jam.status)}
          </div>

          {jam.theme && (
            <p className="text-[#ffff00] text-xs mb-2 font-pixel">
              THEME: {jam.theme}
            </p>
          )}

          <p className="text-[#b0b0d0] text-sm mb-4 line-clamp-2">
            {jam.description}
          </p>

          <div className="flex items-center gap-4 text-xs text-[#8080a0]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(jam.startDate)} - {formatDate(jam.endDate)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {jam._count.entries} {jam._count.entries === 1 ? "entry" : "entries"}
            </span>
            {jam.status === "ACTIVE" && (
              <span className="text-[#ff0040] font-pixel text-[10px]">
                ENDS IN {timeUntil(jam.endDate)}
              </span>
            )}
            {jam.status === "VOTING" && (
              <span className="text-[#ffff00] font-pixel text-[10px]">
                VOTING ENDS {timeUntil(jam.votingEndDate)}
              </span>
            )}
            {jam.status === "UPCOMING" && (
              <span className="text-[#00d4ff] font-pixel text-[10px]">
                STARTS IN {timeUntil(jam.startDate)}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}

function JamSection({ title, jams, icon }: { title: string; jams: JamSummary[]; icon: React.ReactNode }) {
  if (jams.length === 0) return null

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="font-pixel text-base text-white">{title}</h2>
        <span className="text-[#8080a0] text-sm">({jams.length})</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jams.map((jam) => (
          <JamCard key={jam.id} jam={jam} />
        ))}
      </div>
    </div>
  )
}

export function JamsList({ groups }: { groups: JamsGroups }) {
  const hasAny = groups.active.length + groups.upcoming.length + groups.voting.length + groups.completed.length > 0

  if (!hasAny) {
    return (
      <div className="text-center py-20">
        <Trophy className="w-12 h-12 text-[#4a4a6a] mx-auto mb-4" />
        <p className="text-[#b0b0d0] font-pixel text-sm mb-2">NO JAMS YET</p>
        <p className="text-[#8080a0] text-sm">Game jams will appear here when an admin creates one.</p>
      </div>
    )
  }

  return (
    <div>
      <JamSection
        title="LIVE NOW"
        jams={groups.active}
        icon={<Zap className="w-5 h-5 text-[#00ff40]" />}
      />
      <JamSection
        title="VOTING OPEN"
        jams={groups.voting}
        icon={<Vote className="w-5 h-5 text-[#ffff00]" />}
      />
      <JamSection
        title="COMING SOON"
        jams={groups.upcoming}
        icon={<Clock className="w-5 h-5 text-[#00d4ff]" />}
      />
      <JamSection
        title="PAST JAMS"
        jams={groups.completed}
        icon={<Trophy className="w-5 h-5 text-[#b0b0d0]" />}
      />
    </div>
  )
}
