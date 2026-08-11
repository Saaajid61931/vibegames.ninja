"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { SessionProvider } from "next-auth/react"
import { ToastProvider } from "@/components/ui/toast"

const DeferredPageTransitionLoader = dynamic(
  () => import("@/components/layout/page-transition-loader").then((mod) => mod.PageTransitionLoader),
  {
    ssr: false,
    loading: () => null,
  }
)

export function Providers({ children }: { children: React.ReactNode }) {
  const [showPageTransitionLoader, setShowPageTransitionLoader] = useState(false)

  useEffect(() => {
    let cancelled = false
    let firstFrameId: number | null = null
    let secondFrameId: number | null = null

    firstFrameId = window.requestAnimationFrame(() => {
      secondFrameId = window.requestAnimationFrame(() => {
        if (!cancelled) {
          setShowPageTransitionLoader(true)
        }
      })
    })

    return () => {
      cancelled = true

      if (firstFrameId !== null) {
        window.cancelAnimationFrame(firstFrameId)
      }

      if (secondFrameId !== null) {
        window.cancelAnimationFrame(secondFrameId)
      }
    }
  }, [])

  return (
    <SessionProvider>
      <ToastProvider>
        {children}
        {showPageTransitionLoader ? <DeferredPageTransitionLoader /> : null}
      </ToastProvider>
    </SessionProvider>
  )
}
