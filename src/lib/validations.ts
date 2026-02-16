import { z } from 'zod'

const MAX_LEVEL_DATA_BYTES = 5 * 1024 * 1024

const levelDataSchema = z
  .unknown()
  .refine(
    (value) => Array.isArray(value) || (typeof value === 'object' && value !== null),
    'Level data must be an object or array'
  )
  .refine(
    (value) => new TextEncoder().encode(JSON.stringify(value)).length <= MAX_LEVEL_DATA_BYTES,
    'Level data exceeds 5MB limit'
  )

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const gameUploadSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be less than 2000 characters'),
  instructions: z.string().max(1000, 'Instructions must be less than 1000 characters').optional(),
  category: z.string(),
  tags: z.string(),
  isAIGenerated: z.boolean().default(true),
  aiTool: z.string().optional(),
  aiModel: z.string().optional(),
  supportsMobile: z.boolean().default(false),
  hasLevelEditor: z.boolean().default(false),
  isPremium: z.boolean().default(false),
  price: z.number().min(0).max(99.99).optional(),
  hasAds: z.boolean().default(true),
})

export const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment must be less than 1000 characters'),
  gameId: z.string(),
  parentId: z.string().optional(),
})

export const reportSchema = z.object({
  gameId: z.string(),
  reason: z.enum(['COPYRIGHT', 'INAPPROPRIATE', 'MALWARE', 'SPAM', 'OTHER']),
  description: z.string().max(500).optional(),
})

export const levelInputSchema = z.object({
  name: z.string().min(3, 'Level name must be at least 3 characters').max(80, 'Level name must be less than 80 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  data: levelDataSchema,
  thumbnail: z
    .string()
    .max(512_000, 'Thumbnail must be less than 500KB')
    .refine(
      (val) => val.startsWith('data:image/') || val.startsWith('https://') || val.startsWith('http://'),
      'Thumbnail must be a data URL or HTTP(S) URL'
    )
    .optional(),
})

export const ratingSchema = z.object({
  score: z.number().int().min(1).max(5),
})

export const gameJamSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description must be less than 5000 characters'),
  theme: z.string().max(200, 'Theme must be less than 200 characters').optional(),
  rules: z.string().max(5000, 'Rules must be less than 5000 characters').optional(),
  bannerImage: z.string().url().optional(),
  startDate: z.string().datetime({ message: 'Invalid start date' }),
  endDate: z.string().datetime({ message: 'Invalid end date' }),
  votingEndDate: z.string().datetime({ message: 'Invalid voting end date' }),
  maxEntries: z.number().int().min(1).max(10).default(1),
})

export const gameJamEntrySchema = z.object({
  gameId: z.string().min(1, 'Game ID is required'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type GameUploadInput = z.infer<typeof gameUploadSchema>
export type CommentInput = z.infer<typeof commentSchema>
export type ReportInput = z.infer<typeof reportSchema>
export type LevelInput = z.infer<typeof levelInputSchema>
export type RatingInput = z.infer<typeof ratingSchema>
export type GameJamInput = z.infer<typeof gameJamSchema>
export type GameJamEntryInput = z.infer<typeof gameJamEntrySchema>
