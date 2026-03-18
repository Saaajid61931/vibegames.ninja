type ServerLogLevel = "info" | "error"

type ServerLogContext = {
  route?: string
  method?: string
  userId?: string | null
  [key: string]: unknown
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  return {
    value: typeof error === "string" ? error : JSON.stringify(error),
  }
}

function writeLog(level: ServerLogLevel, message: string, context: ServerLogContext = {}, error?: unknown) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
    ...(error === undefined ? {} : { error: serializeError(error) }),
  }

  const line = JSON.stringify(payload)
  if (level === "error") {
    console.error(line)
    return
  }

  console.info(line)
}

export function logServerInfo(message: string, context: ServerLogContext = {}) {
  writeLog("info", message, context)
}

export function logServerError(message: string, error: unknown, context: ServerLogContext = {}) {
  writeLog("error", message, context, error)
}
