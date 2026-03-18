"use client"

import { RouteErrorState } from "@/components/ui/route-error-state"

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <RouteErrorState
      title="JAMS OFFLINE"
      description="We couldn’t load the latest jam lineup right now. Try again in a moment."
      reset={reset}
    />
  )
}
