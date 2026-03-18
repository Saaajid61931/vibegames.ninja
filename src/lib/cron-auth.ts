import { NextResponse } from "next/server"
import { getCronAuthProblem } from "./cron-auth-core"

export { getCronAuthProblem } from "./cron-auth-core"

export function createCronAuthErrorResponse(problem: NonNullable<ReturnType<typeof getCronAuthProblem>>) {
  return NextResponse.json({ error: problem.error }, { status: problem.status })
}
