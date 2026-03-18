type HeadersLike = {
  get(name: string): string | null
}

export type CronAuthProblem = {
  error: "CRON_SECRET_MISSING" | "UNAUTHORIZED"
  status: number
}

export function getCronAuthProblem(
  request: { headers: HeadersLike },
  options: {
    cronSecret?: string | null
    nodeEnv?: string
  } = {}
): CronAuthProblem | null {
  const cronSecret = options.cronSecret?.trim() ?? process.env.CRON_SECRET?.trim() ?? ""
  const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV ?? "development"

  if (!cronSecret) {
    if (nodeEnv !== "development") {
      return {
        error: "CRON_SECRET_MISSING",
        status: 503,
      }
    }

    return null
  }

  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${cronSecret}`) {
    return {
      error: "UNAUTHORIZED",
      status: 401,
    }
  }

  return null
}
