import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const CANONICAL_HOST = "vibegames.ninja"

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.replace(/:\d+$/, "")

  // Redirect any non-canonical domain (e.g. vibegames.ai) to vibegames.ninja
  if (host && host !== CANONICAL_HOST && host !== "localhost") {
    const url = request.nextUrl.clone()
    url.host = CANONICAL_HOST
    url.port = ""
    url.protocol = "https:"
    return NextResponse.redirect(url, 301)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Run on all routes except static files and internal Next.js paths
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|vibegames-sdk\\.js).*)",
  ],
}
