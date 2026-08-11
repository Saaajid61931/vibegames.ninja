"use client"

import * as ToastPrimitive from "@radix-ui/react-toast"
import { CheckCircle2, X, XCircle } from "lucide-react"
import { createContext, useCallback, useContext, useRef, useState } from "react"
import { cn } from "@/lib/utils"

type ToastTone = "success" | "error" | "info"

type ToastMessage = {
  id: number
  title: string
  description?: string
  tone: ToastTone
}

type ToastInput = Omit<ToastMessage, "id"> & { tone?: ToastTone }

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const nextId = useRef(0)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((toast: ToastInput) => {
    nextId.current += 1
    setToasts((current) => [
      ...current.slice(-2),
      { ...toast, id: nextId.current, tone: toast.tone || "info" },
    ])
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      <ToastPrimitive.Provider swipeDirection="right" duration={4200}>
        {children}
        {toasts.map((toast) => {
          const Icon = toast.tone === "error" ? XCircle : CheckCircle2

          return (
            <ToastPrimitive.Root
              key={toast.id}
              defaultOpen
              onOpenChange={(open) => {
                if (!open) {
                  setToasts((current) => current.filter((item) => item.id !== toast.id))
                }
              }}
              className={cn(
                "grid grid-cols-[auto_1fr_auto] items-start gap-3 border-2 bg-surface p-4 text-text shadow-hard-4",
                "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-right-full data-[state=closed]:fade-out",
                toast.tone === "error" ? "border-danger" : "border-arcade-cyan"
              )}
            >
              <Icon
                className={cn(
                  "mt-0.5 h-5 w-5",
                  toast.tone === "error" ? "text-danger" : "text-arcade-cyan"
                )}
                aria-hidden="true"
              />
              <div>
                <ToastPrimitive.Title className="text-sm font-semibold">
                  {toast.title}
                </ToastPrimitive.Title>
                {toast.description ? (
                  <ToastPrimitive.Description className="mt-1 text-xs leading-5 text-text-secondary">
                    {toast.description}
                  </ToastPrimitive.Description>
                ) : null}
              </div>
              <ToastPrimitive.Close
                className="grid h-8 w-8 place-items-center text-text-secondary transition-colors hover:bg-surface-2 hover:text-text"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          )
        })}
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const showToast = useContext(ToastContext)

  if (!showToast) {
    throw new Error("useToast must be used inside ToastProvider")
  }

  return showToast
}
