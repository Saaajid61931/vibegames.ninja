import { z } from 'zod'

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

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type GameUploadInput = z.infer<typeof gameUploadSchema>
export type CommentInput = z.infer<typeof commentSchema>
export type ReportInput = z.infer<typeof reportSchema>
