import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d15] px-4">
      <div className="text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#ffff00]" />
        <p className="mt-4 font-arcade text-sm text-[#b0b0d0]">Loading VibeGames...</p>
      </div>
    </div>
  )
}
