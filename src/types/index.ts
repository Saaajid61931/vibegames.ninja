import { Game, User, Comment, GameAnalytics } from '@prisma/client'

export type GameWithCreator = Game & {
  creator: Pick<User, 'id' | 'name' | 'username' | 'image'>
}

export type GameWithDetails = Game & {
  creator: Pick<User, 'id' | 'name' | 'username' | 'image'>
  comments: (Comment & {
    user: Pick<User, 'id' | 'name' | 'username' | 'image'>
  })[]
  _count: {
    favorites: number
    comments: number
  }
}

export type GameCardData = Pick<
  Game,
  'id' | 'slug' | 'title' | 'thumbnail' | 'category' | 'plays' | 'likes' | 'createdAt' | 'supportsMobile' | 'aiModel'
> & {
  creator: Pick<User, 'name' | 'username' | 'image'>
}

export type CreatorStats = {
  totalGames: number
  totalPlays: number
  totalLikes: number
  totalEarnings: number
  monthlyEarnings: number
  topGames: GameCardData[]
}

export type AnalyticsData = {
  daily: GameAnalytics[]
  totalPlays: number
  totalUniquePlayers: number
  avgSessionTime: number
  totalRevenue: number
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}
