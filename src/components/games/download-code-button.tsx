import Link from "next/link"
import { Info } from "lucide-react"
export function DownloadCodeButton({
  game,
  className = "",
}: {
  game: { slug: string; title: string }
  variant?: "feed" | "standard"
  className?: string
}) {
  return (
    <Link
      href={`/play/${game.slug}#source-project`}
      aria-label={`About ${game.title} and source availability`}
      className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg border border-border bg-surface text-xs text-text-secondary hover:text-primary-text ${className}`}
    >
      <Info className="h-4 w-4" />
      Details
    </Link>
  )
}
