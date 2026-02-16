"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Unhandled error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d15] px-4">
      <div className="text-center max-w-md">
        <AlertTriangle className="h-16 w-16 text-[#ff0040] mx-auto mb-6" />
        <h1 className="font-arcade text-2xl text-white mb-3">SYSTEM_ERROR</h1>
        <p className="font-arcade text-sm text-[#4a4a6a] mb-2">
          Something went wrong while loading this page.
        </p>
        {error.digest && (
          <p className="font-arcade text-[10px] text-[#4a4a6a] mb-6">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <Button
            onClick={reset}
            variant="arcade"
            className="gap-2 font-arcade"
          >
            <RefreshCw className="h-4 w-4" />
            RETRY
          </Button>
          <Link href="/">
            <Button variant="arcade-outline" className="gap-2 font-arcade w-full sm:w-auto">
              <Home className="h-4 w-4" />
              HOME
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
