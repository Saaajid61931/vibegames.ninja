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
      title="GAME LOAD ERROR"
      description="We couldn’t finish loading this game page. Retry to reconnect the player, comments, and creator info."
      reset={reset}
    />
  )
}
