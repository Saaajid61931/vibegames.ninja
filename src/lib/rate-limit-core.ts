export type RateLimitPolicy = {
  name: string
  limit: number
  windowMs: number
}

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
  resetAt: number
  key: string
}

type RateLimitBucket = {
  count: number
  resetAt: number
}

type GlobalRateLimitStore = {
  buckets: Map<string, RateLimitBucket>
}

declare global {
  var __vgRateLimitStore: GlobalRateLimitStore | undefined
}

const globalRateLimitStore =
  globalThis.__vgRateLimitStore ??
  {
    buckets: new Map<string, RateLimitBucket>(),
  }

if (!globalThis.__vgRateLimitStore) {
  globalThis.__vgRateLimitStore = globalRateLimitStore
}

export const RATE_LIMIT_POLICIES = {
  register: { name: "register", limit: 5, windowMs: 60 * 60 * 1000 },
  reports: { name: "reports", limit: 10, windowMs: 10 * 60 * 1000 },
  comments: { name: "comments", limit: 10, windowMs: 10 * 60 * 1000 },
  feedback: { name: "feedback", limit: 10, windowMs: 10 * 60 * 1000 },
  jamSubmit: { name: "jam-submit", limit: 10, windowMs: 10 * 60 * 1000 },
  jamVote: { name: "jam-vote", limit: 10, windowMs: 10 * 60 * 1000 },
  ghostUpload: { name: "ghost-upload", limit: 10, windowMs: 10 * 60 * 1000 },
  likes: { name: "likes", limit: 30, windowMs: 60 * 1000 },
  follows: { name: "follows", limit: 30, windowMs: 60 * 1000 },
  shares: { name: "shares", limit: 30, windowMs: 60 * 1000 },
} satisfies Record<string, RateLimitPolicy>

export class MemoryRateLimiter {
  constructor(private readonly store: GlobalRateLimitStore = globalRateLimitStore) {}

  consume(key: string, policy: RateLimitPolicy, now = Date.now()): RateLimitResult {
    const existing = this.store.buckets.get(key)

    if (!existing || existing.resetAt <= now) {
      const resetAt = now + policy.windowMs
      this.store.buckets.set(key, { count: 1, resetAt })
      return {
        allowed: true,
        remaining: Math.max(policy.limit - 1, 0),
        retryAfterSeconds: Math.max(1, Math.ceil(policy.windowMs / 1000)),
        resetAt,
        key,
      }
    }

    if (existing.count >= policy.limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
        resetAt: existing.resetAt,
        key,
      }
    }

    existing.count += 1
    this.store.buckets.set(key, existing)

    return {
      allowed: true,
      remaining: Math.max(policy.limit - existing.count, 0),
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      resetAt: existing.resetAt,
      key,
    }
  }

  clear() {
    this.store.buckets.clear()
  }
}
