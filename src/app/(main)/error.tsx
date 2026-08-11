"use client"

import { useEffect } from "react"
import { RouteErrorState } from "@/components/ui/route-error-state"

export default function MainRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Main route error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-canvas">
      <RouteErrorState
        title="Arcade signal lost"
        description={error.digest
          ? `This route hit an unexpected error. Reference: ${error.digest}`
          : "This route hit an unexpected error. Retry the cabinet or return home."}
        reset={reset}
      />
    </div>
  )
}
