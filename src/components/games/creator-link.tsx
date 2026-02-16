"use client"

import { useCallback } from "react"

interface CreatorLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export function CreatorLink({ href, children, className }: CreatorLinkProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      window.location.href = href
    },
    [href]
  )

  return (
    <span
      className={className}
      onClick={handleClick}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          e.stopPropagation()
          window.location.href = href
        }
      }}
    >
      {children}
    </span>
  )
}
