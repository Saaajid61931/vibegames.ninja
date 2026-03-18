import prisma from "./prisma"

type GameAnalyticsClient = Pick<typeof prisma, "gameAnalytics">
type GameJamClient = Pick<typeof prisma, "gameJam">

type DailyGameAnalyticsMetricValue = number | { increment: number }

type DailyGameAnalyticsCreateValues = {
  plays?: number
  uniquePlayers?: number
  avgSessionTime?: number
  bounceRate?: number
  adImpressions?: number
  adClicks?: number
  revenue?: number
}

type DailyGameAnalyticsUpdateValues = {
  plays?: DailyGameAnalyticsMetricValue
  uniquePlayers?: DailyGameAnalyticsMetricValue
  avgSessionTime?: number
  bounceRate?: number
  adImpressions?: DailyGameAnalyticsMetricValue
  adClicks?: DailyGameAnalyticsMetricValue
  revenue?: DailyGameAnalyticsMetricValue
}

export type DailyGameAnalyticsSnapshot = {
  id: string
  plays: number
  avgSessionTime: number
  bounceRate: number
}

export type JamStatus = "UPCOMING" | "ACTIVE" | "VOTING" | "COMPLETED"

export type JamStatusSyncResult = {
  upcomingToActive: number
  activeToVoting: number
  votingToCompleted: number
  totalUpdated: number
}

export type JamSurfaceSummary = {
  slug: string
  title: string
  theme: string | null
  bannerImage?: string | null
  status: string
  startDate: Date | string
  endDate: Date | string
  votingEndDate: Date | string
}

type JamEntryLike = {
  jam: JamSurfaceSummary
}

function toTime(value: Date | string) {
  return value instanceof Date ? value.getTime() : new Date(value).getTime()
}

export function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

export function nextUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1))
}

export function utcDayKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`
}

export function secondsUntilNextUtcDay(date: Date) {
  return Math.max(60, Math.ceil((nextUtcDay(date).getTime() - date.getTime()) / 1000))
}

export async function syncJamStatuses(
  now = new Date(),
  db: GameJamClient = prisma
): Promise<JamStatusSyncResult> {
  const upcomingToActive = await db.gameJam.updateMany({
    where: { status: "UPCOMING", startDate: { lte: now } },
    data: { status: "ACTIVE" },
  })

  const activeToVoting = await db.gameJam.updateMany({
    where: { status: "ACTIVE", endDate: { lte: now } },
    data: { status: "VOTING" },
  })

  const votingToCompleted = await db.gameJam.updateMany({
    where: { status: "VOTING", votingEndDate: { lte: now } },
    data: { status: "COMPLETED" },
  })

  return {
    upcomingToActive: upcomingToActive.count,
    activeToVoting: activeToVoting.count,
    votingToCompleted: votingToCompleted.count,
    totalUpdated: upcomingToActive.count + activeToVoting.count + votingToCompleted.count,
  }
}

export async function findDailyGameAnalytics(
  db: GameAnalyticsClient,
  gameId: string,
  date: Date
): Promise<DailyGameAnalyticsSnapshot | null> {
  return db.gameAnalytics.findUnique({
    where: {
      gameId_date: {
        gameId,
        date: startOfUtcDay(date),
      },
    },
    select: {
      id: true,
      plays: true,
      avgSessionTime: true,
      bounceRate: true,
    },
  }) as Promise<DailyGameAnalyticsSnapshot | null>
}

export async function upsertDailyGameAnalytics(
  db: GameAnalyticsClient,
  gameId: string,
  date: Date,
  create: DailyGameAnalyticsCreateValues,
  update: DailyGameAnalyticsUpdateValues
) {
  const dayStart = startOfUtcDay(date)

  return db.gameAnalytics.upsert({
    where: {
      gameId_date: {
        gameId,
        date: dayStart,
      },
    },
    create: {
      gameId,
      date: dayStart,
      ...create,
    },
    update,
    select: { id: true },
  })
}

export function pickPrimaryJam(entries: Array<JamEntryLike | null | undefined>) {
  const jams = entries
    .map((entry) => entry?.jam)
    .filter((jam): jam is JamSurfaceSummary => Boolean(jam))

  if (jams.length === 0) {
    return null
  }

  return [...jams].sort((left, right) => {
    const leftStatus = getLiveJamStatus(left)
    const rightStatus = getLiveJamStatus(right)
    const leftPriority = getJamStatusPriority(leftStatus)
    const rightPriority = getJamStatusPriority(rightStatus)

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority
    }

    return getRelevantJamTimestamp(left, leftStatus) - getRelevantJamTimestamp(right, rightStatus)
  })[0]
}

export function getLiveJamStatus(jam: Pick<JamSurfaceSummary, "startDate" | "endDate" | "votingEndDate">): JamStatus {
  const now = Date.now()
  const startTime = toTime(jam.startDate)
  const endTime = toTime(jam.endDate)
  const votingEndTime = toTime(jam.votingEndDate)

  if (now >= startTime && now < endTime) {
    return "ACTIVE"
  }

  if (now >= endTime && now < votingEndTime) {
    return "VOTING"
  }

  if (now >= votingEndTime) {
    return "COMPLETED"
  }

  return "UPCOMING"
}

function getJamStatusPriority(status: JamStatus) {
  switch (status) {
    case "ACTIVE":
      return 0
    case "VOTING":
      return 1
    case "UPCOMING":
      return 2
    case "COMPLETED":
      return 3
    default:
      return 4
  }
}

function getRelevantJamTimestamp(jam: Pick<JamSurfaceSummary, "startDate" | "endDate" | "votingEndDate">, status: JamStatus) {
  switch (status) {
    case "ACTIVE":
      return toTime(jam.endDate)
    case "VOTING":
      return toTime(jam.votingEndDate)
    case "UPCOMING":
      return toTime(jam.startDate)
    case "COMPLETED":
      return -toTime(jam.votingEndDate)
    default:
      return Number.MAX_SAFE_INTEGER
  }
}

export function toPrimaryJamBadge(jam: JamSurfaceSummary | null) {
  if (!jam) {
    return null
  }

  return {
    slug: jam.slug,
    title: jam.title,
    theme: jam.theme,
    status: getLiveJamStatus(jam),
  }
}

export function getJamAction(
  jam: JamSurfaceSummary,
  options?: {
    surface?: "banner" | "play"
    isAuthenticated?: boolean
  }
) {
  const status = getLiveJamStatus(jam)
  const surface = options?.surface || "banner"
  const jamHref = `/jams/${jam.slug}`

  if (surface === "play") {
    switch (status) {
      case "VOTING":
        return { label: "Vote Now", href: jamHref }
      case "COMPLETED":
        return { label: "View Results", href: jamHref }
      default:
        return { label: "Visit Jam", href: jamHref }
    }
  }

  switch (status) {
    case "ACTIVE":
      return {
        label: options?.isAuthenticated ? "Upload for Jam" : "Sign in to Upload",
        href: options?.isAuthenticated
          ? `/upload?jam=${encodeURIComponent(jam.slug)}`
          : `/login?callbackUrl=${encodeURIComponent(`/upload?jam=${jam.slug}`)}`,
      }
    case "VOTING":
      return { label: "Vote Now", href: jamHref }
    case "COMPLETED":
      return { label: "View Results", href: jamHref }
    case "UPCOMING":
    default:
      return { label: "View Jam", href: jamHref }
  }
}
