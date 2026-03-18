import type { NextRequest } from "next/server"

export function getBuilderPreviewPath(projectId: string, options?: { revisionId?: string | null; published?: boolean }) {
  const params = new URLSearchParams()
  if (options?.revisionId) {
    params.set("revisionId", options.revisionId)
  }
  if (options?.published) {
    params.set("published", "1")
  }

  const query = params.toString()
  return `/api/builder/projects/${projectId}/preview${query ? `?${query}` : ""}`
}

export function getRequestOrigin(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto")
  const forwardedHost = request.headers.get("x-forwarded-host")
  const host = forwardedHost || request.headers.get("host")

  if (!host) {
    return null
  }

  const protocol = forwardedProto || "https"
  return `${protocol}://${host}`
}

export function toAbsoluteUrl(origin: string | null | undefined, path: string) {
  if (!origin) {
    return path
  }

  return new URL(path, origin).toString()
}
