"use client"

import Link from "next/link"
import { AlertTriangle, Home, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

type RouteErrorStateProps = {
  title: string
  description: string
  reset: () => void
}

export function RouteErrorState({ title, description, reset }: RouteErrorStateProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <AlertTriangle className="mx-auto mb-6 h-14 w-14 text-arcade-red" />
        <h1 className="heading-pixel-lg text-white">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-text-secondary">{description}</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={reset} variant="arcade" className="gap-2 font-arcade">
            <RefreshCw className="h-4 w-4" />
            RETRY
          </Button>
          <Link href="/">
            <Button variant="arcade-outline" className="w-full gap-2 font-arcade sm:w-auto">
              <Home className="h-4 w-4" />
              HOME
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
