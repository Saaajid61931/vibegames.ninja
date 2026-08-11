"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

interface CreatorLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export function CreatorLink({ href, children, className }: CreatorLinkProps) {
  return (
    <Link
      href={href}
      className={cn("inline-flex min-h-11 items-center px-1", className)}
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </Link>
  )
}
