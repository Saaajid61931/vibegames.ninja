import prisma from "./prisma"
import { addDays } from "date-fns"
import { deleteGameAssetsFromR2 } from "./storage"

// Retention rules
export const RETENTION_DAYS = 3
export const LIKES_FOR_PERMANENT = 100

/**
 * Calculate expiration date for a new game
 */
export function calculateExpirationDate(): Date {
  return addDays(new Date(), RETENTION_DAYS)
}

/**
 * Check if a game has reached permanent status (100+ likes)
 */
export function hasReachedPermanent(likes: number): boolean {
  return likes >= LIKES_FOR_PERMANENT
}

/**
 * Get time remaining until expiration
 */
export function getTimeRemaining(expiresAt: Date | null): {
  expired: boolean
  hours: number
  minutes: number
  text: string
} {
  if (!expiresAt) {
    return { expired: false, hours: 0, minutes: 0, text: "PERMANENT" }
  }

  const now = new Date()
  const diff = expiresAt.getTime() - now.getTime()

  if (diff <= 0) {
    return { expired: true, hours: 0, minutes: 0, text: "EXPIRED" }
  }

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  let text = ""
  if (hours >= 24) {
    const days = Math.floor(hours / 24)
    text = `${days}d ${hours % 24}h`
  } else if (hours > 0) {
    text = `${hours}h ${minutes}m`
  } else {
    text = `${minutes}m`
  }

  return { expired: false, hours, minutes, text }
}

/**
 * Update game's permanent status when likes change
 */
export async function checkAndUpdatePermanentStatus(gameId: string, likes: number) {
  if (hasReachedPermanent(likes)) {
    await prisma.game.update({
      where: { id: gameId },
      data: {
        isPermanent: true,
        expiresAt: null, // Remove expiration
      },
    })
    return true
  }
  return false
}

/**
 * Expire games that have passed their expiration date
 * This should be run periodically (e.g., via cron job)
 */
export async function expireOldGames() {
  const now = new Date()

  const gamesToExpire = await prisma.game.findMany({
    where: {
      status: "PUBLISHED",
      isPermanent: false,
      expiresAt: {
        lte: now,
      },
    },
    select: {
      id: true,
    },
  })

  if (gamesToExpire.length === 0) {
    return 0
  }

  const gameIds = gamesToExpire.map((game) => game.id)

  const expiredGames = await prisma.game.updateMany({
    where: {
      id: { in: gameIds },
    },
    data: {
      status: "EXPIRED",
    },
  })

  await Promise.allSettled(gameIds.map((gameId) => deleteGameAssetsFromR2(gameId)))

  return expiredGames.count
}

/**
 * Get games that are about to expire (within 24 hours)
 */
export async function getExpiringGames() {
  const now = new Date()
  const in24Hours = addDays(now, 1)

  return prisma.game.findMany({
    where: {
      status: "PUBLISHED",
      isPermanent: false,
      expiresAt: {
        gte: now,
        lte: in24Hours,
      },
    },
    include: {
      creator: {
        select: { id: true, email: true, name: true },
      },
    },
  })
}

/**
 * Calculate likes needed for a game to become permanent
 */
export function likesNeeded(currentLikes: number): number {
  return Math.max(0, LIKES_FOR_PERMANENT - currentLikes)
}

/**
 * Format retention status for display
 */
export function formatRetentionStatus(game: {
  likes: number
  expiresAt: Date | null
  isPermanent: boolean
}): {
  status: "permanent" | "expiring" | "expired" | "safe"
  message: string
  urgent: boolean
} {
  if (game.isPermanent || game.likes >= LIKES_FOR_PERMANENT) {
    return {
      status: "permanent",
      message: "PERMANENT",
      urgent: false,
    }
  }

  if (!game.expiresAt) {
    return {
      status: "safe",
      message: "ACTIVE",
      urgent: false,
    }
  }

  const remaining = getTimeRemaining(game.expiresAt)
  
  if (remaining.expired) {
    return {
      status: "expired",
      message: "EXPIRED",
      urgent: false,
    }
  }

  const likesLeft = likesNeeded(game.likes)
  const isUrgent = remaining.hours < 24

  return {
    status: "expiring",
    message: `${remaining.text} | ${likesLeft} LIKES NEEDED`,
    urgent: isUrgent,
  }
}
