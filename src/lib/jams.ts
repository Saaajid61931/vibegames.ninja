export type JamStatus = "UPCOMING" | "ACTIVE" | "VOTING" | "COMPLETED"

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
