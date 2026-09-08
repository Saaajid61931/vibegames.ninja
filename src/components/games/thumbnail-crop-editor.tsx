"use client"

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import Image from "next/image"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Crop, Loader2, Move, RotateCcw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  cropAndOptimizeThumbnailFile,
  type OptimizedThumbnail,
} from "@/lib/thumbnail-image"

interface ThumbnailCropEditorProps {
  file: File | null
  onCancel: () => void
  onApply: (result: OptimizedThumbnail) => void
  onError: (message: string) => void
}

const clamp = (value: number) => Math.min(1, Math.max(-1, value))

export function ThumbnailCropEditor({
  file,
  onCancel,
  onApply,
  onError,
}: ThumbnailCropEditorProps) {
  const [sourceUrl, setSourceUrl] = useState("")
  const [sourceSize, setSourceSize] = useState({ width: 16, height: 9 })
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [processing, setProcessing] = useState(false)
  const dragRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null)

  useEffect(() => {
    if (!file) {
      setSourceUrl("")
      return
    }
    const url = URL.createObjectURL(file)
    setSourceUrl(url)
    setZoom(1)
    setOffset({ x: 0, y: 0 })
    return () => URL.revokeObjectURL(url)
  }, [file])

  const imageLayout = useMemo(() => {
    const sourceRatio = sourceSize.width / sourceSize.height
    const targetRatio = 16 / 9
    const baseWidth = sourceRatio >= targetRatio ? sourceRatio / targetRatio : 1
    const baseHeight = sourceRatio >= targetRatio ? 1 : targetRatio / sourceRatio
    const width = baseWidth * zoom
    const height = baseHeight * zoom
    return {
      width: `${width * 100}%`,
      height: `${height * 100}%`,
      left: `${50 + offset.x * Math.max(0, width - 1) * 50}%`,
      top: `${50 + offset.y * Math.max(0, height - 1) * 50}%`,
    }
  }, [offset.x, offset.y, sourceSize.height, sourceSize.width, zoom])

  const nudge = (x: number, y: number) => {
    setOffset((current) => ({ x: clamp(current.x + x), y: clamp(current.y + y) }))
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { x: event.clientX, y: event.clientY, offsetX: offset.x, offsetY: offset.y }
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const bounds = event.currentTarget.getBoundingClientRect()
    setOffset({
      x: clamp(drag.offsetX + (event.clientX - drag.x) / Math.max(80, bounds.width * 0.35)),
      y: clamp(drag.offsetY + (event.clientY - drag.y) / Math.max(80, bounds.height * 0.35)),
    })
  }

  const applyCrop = async () => {
    if (!file || processing) return
    setProcessing(true)
    try {
      const result = await cropAndOptimizeThumbnailFile(file, {
        zoom,
        offsetX: offset.x,
        offsetY: offset.y,
      })
      onApply(result)
    } catch (error) {
      onError(error instanceof Error ? error.message : "Could not crop the thumbnail image")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <DialogPrimitive.Root open={Boolean(file)} onOpenChange={(open) => !open && !processing && onCancel()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto border-3 border-border-strong bg-surface p-4 shadow-hard-8 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogPrimitive.Title className="flex items-center gap-2 font-arcade text-sm uppercase text-white sm:text-base">
                <Crop className="h-5 w-5 text-arcade-yellow" aria-hidden="true" />
                Crop game thumbnail
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-2 text-sm text-text-secondary">
                Drag to reposition, then zoom until the 16:9 frame looks right.
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close asChild>
              <button type="button" disabled={processing} aria-label="Close crop editor" className="grid h-10 w-10 shrink-0 place-items-center border border-border-strong text-text-secondary hover:border-arcade-yellow hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </DialogPrimitive.Close>
          </div>

          <div
            role="application"
            aria-label="Thumbnail crop area. Drag the image or use arrow keys to reposition it."
            tabIndex={0}
            onKeyDown={(event) => {
              const step = event.shiftKey ? 0.12 : 0.04
              if (event.key === "ArrowLeft") nudge(-step, 0)
              else if (event.key === "ArrowRight") nudge(step, 0)
              else if (event.key === "ArrowUp") nudge(0, -step)
              else if (event.key === "ArrowDown") nudge(0, step)
              else return
              event.preventDefault()
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => { dragRef.current = null }}
            onPointerCancel={() => { dragRef.current = null }}
            className="relative mt-5 aspect-video touch-none cursor-move overflow-hidden border-3 border-white bg-canvas outline-none focus-visible:ring-2 focus-visible:ring-arcade-cyan"
          >
            {sourceUrl ? (
              <Image
                src={sourceUrl}
                alt="Thumbnail crop preview"
                width={1}
                height={1}
                unoptimized
                draggable={false}
                onLoad={(event) => setSourceSize({
                  width: event.currentTarget.naturalWidth || 16,
                  height: event.currentTarget.naturalHeight || 9,
                })}
                className="pointer-events-none absolute max-w-none select-none"
                style={{
                  ...imageLayout,
                  transform: "translate(-50%, -50%)",
                }}
              />
            ) : null}
            <div className="pointer-events-none absolute inset-0 border-[clamp(8px,2vw,18px)] border-black/30" />
            <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 bg-black/70 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
              <Move className="h-3 w-3" /> Drag to position
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className="flex-1 text-xs font-bold uppercase tracking-widest text-text-secondary">
              Zoom <span className="ml-2 text-arcade-cyan">{zoom.toFixed(1)}×</span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="mt-3 block h-2 w-full cursor-pointer accent-arcade-yellow"
              />
            </label>
            <Button type="button" variant="arcade-outline" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }) }}>
              <RotateCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="arcade-outline" disabled={processing} onClick={onCancel}>Cancel</Button>
            <Button type="button" disabled={!sourceUrl || processing} onClick={() => void applyCrop()}>
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crop className="mr-2 h-4 w-4" />}
              {processing ? "Preparing" : "Apply crop"}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
