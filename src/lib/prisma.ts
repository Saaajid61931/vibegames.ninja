import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Use Hyperdrive connection string if available (Cloudflare Workers)
// Otherwise fall back to DATABASE_URL (local development)
const getDatabaseUrl = () => {
  // In Cloudflare Workers, Hyperdrive provides the connection via env
  // @ts-expect-error - Hyperdrive binding is injected at runtime
  if (typeof globalThis.HYPERDRIVE !== 'undefined') {
    // @ts-expect-error - Hyperdrive binding
    return globalThis.HYPERDRIVE.connectionString
  }
  return process.env.DATABASE_URL
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
