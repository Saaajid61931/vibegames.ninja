import { NextResponse } from "next/server"
import {
  MemoryRateLimiter,
  type RateLimitPolicy,
  type RateLimitResult,
} from "./rate-limit-core"

export { MemoryRateLimiter, RATE_LIMIT_POLICIES, type RateLimitPolicy, type RateLimitResult } from "./rate-limit-core"

function getClientIp(request: RequestHeadersLike) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    const forwardedIp = forwardedFor.split(",")[0]?.trim()
    if (forwardedIp) {
      return forwardedIp
    }
  }

  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-client-ip") ||
    "unknown"
  )
}

type RequestHeadersLike = {
  headers: Headers
}

export function getRateLimitIdentity(
  request: RequestHeadersLike,
  userId?: string | null
) {
  if (userId) {
    return `user:${userId}`
  }

  return `ip:${getClientIp(request)}`
}

export function enforceRateLimit(options: {
  request: RequestHeadersLike
  policy: RateLimitPolicy
  userId?: string | null
  keyPrefix?: string
  limiter?: MemoryRateLimiter
}) {
  const identity = getRateLimitIdentity(options.request, options.userId)
  const keyPrefix = options.keyPrefix ?? options.policy.name

  return (options.limiter ?? rateLimiter).consume(`${keyPrefix}:${identity}`, options.policy)
}

export const rateLimiter = new MemoryRateLimiter()

export function createRateLimitResponse(result: RateLimitResult, message?: string) {
  return NextResponse.json(
    {
      error: "RATE_LIMITED",
      message: message ?? "Too many requests. Please wait and try again.",
      retryAfterSeconds: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
      },
    }
  )
}
