import prisma from "./prisma"
import { getLiveJamStatus } from "./jams"

type JamListDb = Pick<typeof prisma, "gameJam">

type JamListItem = {
  id: string
  title: string
  slug: string
  description: string
  theme: string | null
  bannerImage: string | null
  status: string
  startDate: Date
  endDate: Date
  votingEndDate: Date
  _count: { entries: number }
}

type JamGroups = {
  active: JamListItem[]
  upcoming: JamListItem[]
  voting: JamListItem[]
  completed: JamListItem[]
}

export function groupJamsByLiveStatus<T extends JamListItem>(jams: T[]): JamGroups {
  const groups: JamGroups = {
    active: [],
    upcoming: [],
    voting: [],
    completed: [],
  }

  for (const jam of jams) {
    const liveStatus = getLiveJamStatus(jam)
    const enriched = {
      ...jam,
      status: liveStatus,
    }

    if (liveStatus === "ACTIVE") {
      groups.active.push(enriched)
      continue
    }

    if (liveStatus === "UPCOMING") {
      groups.upcoming.push(enriched)
      continue
    }

    if (liveStatus === "VOTING") {
      groups.voting.push(enriched)
      continue
    }

    groups.completed.push(enriched)
  }

  return groups
}

export async function listJamGroupsForPage(db: JamListDb = prisma) {
  const jams = await db.gameJam.findMany({
    orderBy: [{ startDate: "desc" }],
    include: {
      _count: { select: { entries: true } },
    },
  })

  return groupJamsByLiveStatus(jams)
}
