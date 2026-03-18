import { logServerInfo } from "@/lib/server-log"

export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    return
  }

  logServerInfo("Next.js instrumentation registered", {
    route: "instrumentation",
    runtime: process.env.NEXT_RUNTIME ?? "nodejs",
    nodeEnv: process.env.NODE_ENV ?? "development",
  })
}
