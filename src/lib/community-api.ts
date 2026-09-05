import { SITE_URL } from "@/lib/site"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { enforceRateLimit } from "@/lib/rate-limit"
export class CommunityError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message)
  }
}
export async function requireCommunityUser(request?: Request) {
  if (request && !["GET", "HEAD"].includes(request.method)) {
    const origin = request.headers.get("origin")
    if (origin && ![new URL(request.url).origin, new URL(SITE_URL).origin].includes(origin))
      throw new CommunityError("Request origin is not allowed.", 403)
  }
  const session = await auth()
  if (!session?.user?.id) throw new CommunityError("Please sign in to continue.", 401)
  if (request && !["GET", "HEAD"].includes(request.method)) {
    const result = enforceRateLimit({
      request,
      userId: session.user.id,
      keyPrefix: "community-write",
      policy: { name: "community-write", limit: 40, windowMs: 60000 },
    })
    if (!result.allowed) throw new CommunityError("Please wait a moment before trying again.", 429)
  }
  return session.user
}
export function communityError(error: unknown) {
  if (error instanceof CommunityError)
    return NextResponse.json({ error: error.message }, { status: error.status })
  if (error instanceof z.ZodError)
    return NextResponse.json(
      { error: error.issues[0]?.message || "Check the submitted details." },
      { status: 400 },
    )
  if (error instanceof SyntaxError)
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  console.error("Community operation failed", error instanceof Error ? error.name : "unknown")
  return NextResponse.json(
    { error: "This feature is temporarily unavailable. Please try again." },
    { status: 503 },
  )
}
