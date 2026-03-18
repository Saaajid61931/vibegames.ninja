import { NextRequest, NextResponse } from "next/server"
import { createCronAuthErrorResponse, getCronAuthProblem } from "@/lib/cron-auth"
import { syncJamStatuses } from "@/lib/jams"
import { logServerError } from "@/lib/server-log"

// This endpoint should be called by a cron job (e.g., every hour)
export async function POST(request: NextRequest) {
  try {
    const authProblem = getCronAuthProblem(request)
    if (authProblem) {
      return createCronAuthErrorResponse(authProblem)
    }

    const jamStatusSync = await syncJamStatuses()

    return NextResponse.json({
      success: true,
      message: "Cleanup retention is disabled.",
      jamStatusSync,
    })
  } catch (error) {
    logServerError("Cleanup error", error, {
      route: "/api/cron/cleanup",
      method: "POST",
    })
    return NextResponse.json({ error: "SYSTEM_ERROR" }, { status: 500 })
  }
}
