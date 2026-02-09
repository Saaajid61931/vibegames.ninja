import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Use Hyperdrive connection string if available (Cloudflare Workers)
// Otherwise fall back to DATABASE_URL (local development)
const getDatabaseUrl = (): string | undefined => {
  // In Cloudflare Workers, Hyperdrive provides the connection via env
  // @ts-expect-error - Hyperdrive binding is injected at runtime
  if (typeof globalThis.HYPERDRIVE !== 'undefined' && globalThis.HYPERDRIVE?.connectionString) {
    // @ts-expect-error - Hyperdrive binding
    return globalThis.HYPERDRIVE.connectionString
  }
  return process.env.DATABASE_URL
}

// Lazy initialization to avoid issues during build
const createPrismaClient = () => {
  const url = getDatabaseUrl()
  if (!url) {
    // During build, return a dummy client that will be replaced at runtime
    // This prevents build errors when DATABASE_URL is not available
    return new PrismaClient()
  }
  return new PrismaClient({
    datasources: {
      db: { url },
    },
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
