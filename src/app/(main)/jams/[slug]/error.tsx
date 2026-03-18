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
      title="JAM DETAIL ERROR"
      description="This jam page hit a problem while loading. Retry to fetch the latest entries and standings."
      reset={reset}
    />
  )
}
