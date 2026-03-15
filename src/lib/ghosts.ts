export const DEFAULT_GHOST_LEADERBOARD_LIMIT = 10
export const MAX_GHOST_LEADERBOARD_LIMIT = 25
export const MAX_GHOST_LEADERBOARD_FETCH = 250

type GhostRunner = {
  id: string
  name: string | null
  username: string | null
  image: string | null
}

export type GhostLeaderboardRun = {
  id: string
  levelId: string | null
  userId: string
  durationMs: number
  replayVersion: string | null
  checksum: string | null
  createdAt: Date
  user: GhostRunner
}

export type GhostLeaderboardEntry = {
  rank: number
  runId: string
  levelId: string | null
  userId: string
  durationMs: number
  replayVersion: string | null
  checksum: string | null
  createdAt: Date
  player: GhostRunner
}

export function formatDurationMs(durationMs: number): string {
  const totalMilliseconds = Math.max(0, durationMs)
  const minutes = Math.floor(totalMilliseconds / 60000)
  const seconds = Math.floor((totalMilliseconds % 60000) / 1000)
  const milliseconds = totalMilliseconds % 1000

  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`
  }

  return `${seconds}.${milliseconds.toString().padStart(3, "0")}s`
}

export function buildGhostLeaderboard(runs: GhostLeaderboardRun[], limit = DEFAULT_GHOST_LEADERBOARD_LIMIT): GhostLeaderboardEntry[] {
  const seenUsers = new Set<string>()
  const leaderboard: GhostLeaderboardEntry[] = []

  for (const run of runs) {
    if (seenUsers.has(run.userId)) {
      continue
    }

    seenUsers.add(run.userId)
    leaderboard.push({
      rank: leaderboard.length + 1,
      runId: run.id,
      levelId: run.levelId,
      userId: run.userId,
      durationMs: run.durationMs,
      replayVersion: run.replayVersion,
      checksum: run.checksum,
      createdAt: run.createdAt,
      player: run.user,
    })

    if (leaderboard.length >= limit) {
      break
    }
  }

  return leaderboard
}

export function getGhostPlayerLabel(player: GhostRunner): string {
  return player.username || player.name || "anonymous"
}
