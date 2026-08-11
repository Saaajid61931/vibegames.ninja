import { cn } from "@/lib/utils"

const PLACEHOLDER_TONES = [
  "bg-primary/20 text-arcade-yellow",
  "bg-arcade-cyan/15 text-arcade-cyan",
  "bg-arcade-red/15 text-arcade-red",
  "bg-arcade-green/15 text-arcade-green",
] as const

interface GameThumbnailPlaceholderProps {
  title: string
  className?: string
  compact?: boolean
}

export function GameThumbnailPlaceholder({
  title,
  className,
  compact = false,
}: GameThumbnailPlaceholderProps) {
  const hash = Array.from(title).reduce((total, character) => total + character.charCodeAt(0), 0)
  const tone = PLACEHOLDER_TONES[hash % PLACEHOLDER_TONES.length]
  const initial = title.trim().charAt(0).toUpperCase() || "?"

  return (
    <div
      role="img"
      aria-label={`Pixel-art placeholder for ${title}`}
      className={cn(
        "absolute inset-0 isolate grid place-items-center overflow-hidden bg-canvas",
        tone,
        className
      )}
    >
      <div
        className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] [background-size:16px_16px]"
        aria-hidden="true"
      />
      <span className="absolute left-[12%] top-[18%] h-3 w-3 bg-current shadow-hard-2" aria-hidden="true" />
      <span className="absolute right-[16%] top-[30%] h-5 w-2 bg-current opacity-70" aria-hidden="true" />
      <span className="absolute bottom-[18%] left-[20%] h-2 w-6 bg-current opacity-60" aria-hidden="true" />
      <span className="absolute bottom-[12%] right-[10%] h-4 w-4 border-2 border-current" aria-hidden="true" />
      <div className="relative z-10 flex flex-col items-center gap-2 border-3 border-current bg-canvas/90 px-5 py-4 shadow-hard-4">
        <span className={cn(compact ? "heading-pixel-sm" : "heading-pixel-lg", "leading-none text-white")}>{initial}</span>
        {!compact ? <span className="text-kicker">No preview</span> : null}
      </div>
    </div>
  )
}
