import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d15]">
      <div className="text-center">
        <Loader2 className="h-10 w-10 text-[#ffff00] animate-spin mx-auto mb-4" />
        <p className="font-arcade text-sm text-[#4a4a6a]">LOADING...</p>
      </div>
    </div>
  )
}
