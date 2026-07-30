"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DownloadCodeButtonProps {
  game: {
    id: string
    slug: string
    title: string
    gameUrl: string
    aiTool: string | null
    aiModel: string | null
  }
  variant?: "feed" | "standard"
  className?: string
}

export function DownloadCodeButton({ game, variant = "standard", className }: DownloadCodeButtonProps) {
  const [downloadDrawerOpen, setDownloadDrawerOpen] = useState(false)
  const [paymentStep, setPaymentStep] = useState<"form" | "processing" | "success">("form")
  const [cardNumber, setCardNumber] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvc, setCardCvc] = useState("")
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Custom toast trigger
  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 2500)
  }

  // Download Code Trigger - Generates real compiled HTML file
  const downloadGameCode = () => {
    const codeText = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${game.title} - Source Code</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #0d0d15;
      color: #fff;
      font-family: sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      overflow: hidden;
    }
    .game-container {
      width: 100%;
      height: 100%;
      position: relative;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
  </style>
</head>
<body>
  <!-- 
    Compiled with VibeGames AI Arcade Builder
    Game Title: ${game.title}
    AI Tool: ${game.aiTool || "CLAUDE"}
    AI Model: ${game.aiModel || "CLAUDE-3-7-SONNET"}
  -->
  <div class="game-container">
    <iframe src="${game.gameUrl}"></iframe>
  </div>
</body>
</html>`

    const blob = new Blob([codeText], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${game.slug}-cartridge.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Simulate payment processing
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cardNumber || !cardExpiry || !cardCvc) {
      triggerToast("PLEASE FILL ALL DETAILS")
      return
    }

    setPaymentStep("processing")
    setTimeout(() => {
      setPaymentStep("success")
      
      // Auto trigger download after 1.5 seconds
      setTimeout(() => {
        downloadGameCode()
        setDownloadDrawerOpen(false)
        setCardNumber("")
        setCardExpiry("")
        setCardCvc("")
      }, 1500)
    }, 2000)
  }

  return (
    <>
      {variant === "feed" ? (
        <button
          onClick={() => {
            setPaymentStep("form")
            setDownloadDrawerOpen(true)
          }}
          className={cn(
            "w-full h-10 border-2 border-[#ff0040] bg-[#ff0040]/10 hover:bg-[#ff0040]/25 transition-all text-white font-arcade text-xs rounded-sm flex items-center justify-center gap-2",
            className
          )}
        >
          <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          DOWNLOAD SOURCE CODE ($1)
        </button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "min-w-[120px] flex-1 gap-2 font-arcade sm:flex-none text-[#ff0040] hover:text-white hover:bg-[#ff0040]/10 border-[#ff0040]/30 hover:border-[#ff0040]",
            className
          )}
          onClick={() => {
            setPaymentStep("form")
            setDownloadDrawerOpen(true)
          }}
        >
          <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          [DOWNLOAD]
        </Button>
      )}

      {/* Floating Retro Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-40 left-1/2 -translate-x-1/2 z-55 bg-[#1a1a2e] border-2 border-[#ffff00] px-4 py-2 text-[#ffff00] font-pixel text-[10px] shadow-[4px_4px_0_#ff0040] animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Pay to Download Slide-up Drawer / Modal */}
      {downloadDrawerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/85 p-0 md:items-center md:justify-center md:p-4">
          <div className="absolute inset-0" onClick={() => setDownloadDrawerOpen(false)} />
          
          <div className="w-full md:max-w-md bg-[#1a1a2e] border-t-4 md:border-4 border-[#ff0040] p-5 flex flex-col gap-4 shadow-2xl relative animate-slide-up md:animate-zoom-in">
            {/* Header: Flex layout prevents close button overlap */}
            <div className="flex items-start justify-between border-b border-[#ff0040]/30 pb-3 gap-3">
              <div className="flex-1 text-left">
                <span className="font-pixel text-[9px] text-[#ff0040] tracking-wider uppercase block mb-0.5">
                  SECURE ARCADE CHECKOUT
                </span>
                <h3 className="font-arcade text-sm font-bold text-white leading-tight">
                  SUPPORT THE CREATOR & UNLOCK SOURCE CODE
                </h3>
              </div>
              <button
                onClick={() => setDownloadDrawerOpen(false)}
                className="font-pixel text-[10px] text-[#ff0040] hover:text-white px-2 py-1 border border-[#ff0040]/30 hover:border-white transition-colors rounded-xs shrink-0 self-start"
              >
                [X] CLOSE
              </button>
            </div>

            {paymentStep === "form" && (
              <form onSubmit={handlePaymentSubmit} className="space-y-4 font-arcade text-xs">
                <p className="text-center text-[#a5aec4] leading-relaxed">
                  Pay <span className="text-[#ffff00] font-bold font-pixel">$1.00 USD</span> to download the full HTML/React code package of <span className="text-white font-bold">&quot;{game.title}&quot;</span>.
                </p>

                <div className="space-y-2 text-left">
                  <label className="block text-[9px] text-[#8b93a6] font-pixel">CARD NUMBER</label>
                  <input
                    type="text"
                    required
                    placeholder="4111 2222 3333 4444"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full bg-[#0d0d15] border border-[#4a4a6a] p-2 text-white focus:border-[#ff0040] outline-none font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="space-y-2">
                    <label className="block text-[9px] text-[#8b93a6] font-pixel">EXPIRY DATE</label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full bg-[#0d0d15] border border-[#4a4a6a] p-2 text-white focus:border-[#ff0040] outline-none font-sans"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[9px] text-[#8b93a6] font-pixel">CVV/CVC</label>
                    <input
                      type="password"
                      required
                      placeholder="123"
                      maxLength={4}
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full bg-[#0d0d15] border border-[#4a4a6a] p-2 text-white focus:border-[#ff0040] outline-none font-sans"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 bg-[#ff0040] hover:bg-[#ff0040]/80 text-[#0d0d15] font-pixel text-xs rounded-sm mt-2 font-bold shadow-[2px_2px_0_#fff]"
                >
                  PAY $1.00 & DOWNLOAD CODE
                </Button>
              </form>
            )}

            {paymentStep === "processing" && (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#ff0040]" />
                <span className="font-pixel text-[11px] text-[#ff0040] animate-pulse">
                  PROCESSING TRANSACTION...
                </span>
                <span className="font-arcade text-[10px] text-[#8b93a6]">
                  AUTHORIZING COIN TRANSFER...
                </span>
              </div>
            )}

            {paymentStep === "success" && (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <div className="w-10 h-10 rounded-full bg-[#22c55e]/20 border-2 border-[#22c55e] flex items-center justify-center text-[#22c55e]">
                  ✓
                </div>
                <span className="font-pixel text-[11px] text-[#22c55e] mt-2">
                  TRANSACTION COMPLETE!
                </span>
                <span className="font-arcade text-[10px] text-white">
                  DOWNLOADING SOURCE CARTRIDGE NOW...
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
