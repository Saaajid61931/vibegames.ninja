import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Domains that should redirect to vibegames.ninja
const REDIRECT_HOSTS = ["vibegames.ai", "www.vibegames.ai", "www.vibegames.ninja"]

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.replace(/:\d+$/, "")

  // Only redirect known alias domains to vibegames.ninja
  if (host && REDIRECT_HOSTS.includes(host)) {
    const url = request.nextUrl.clone()
    url.host = "vibegames.ninja"
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
