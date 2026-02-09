"use client"

import { Suspense } from "react"
import { SessionProvider } from "next-auth/react"
import { PageTransitionLoader } from "@/components/layout/page-transition-loader"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Suspense fallback={null}>
        <PageTransitionLoader />
      </Suspense>
    </SessionProvider>
  )
}
