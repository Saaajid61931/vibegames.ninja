import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const VALID_DEVELOPMENT_DATABASE_URL_PREFIXES = [
  "prisma://",
  "postgresql://",
  "postgres://",
  "mysql://",
  "sqlserver://",
  "mongodb://",
  "file:",
] as const

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export function isPrismaDatasourceConfigured() {
  const databaseUrl = process.env.DATABASE_URL?.trim() || ""
  if (!databaseUrl) {
    return false
  }

  return VALID_DEVELOPMENT_DATABASE_URL_PREFIXES.some((prefix) =>
    databaseUrl.startsWith(prefix),
  )
}

export default prisma
