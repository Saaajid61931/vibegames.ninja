"use client"

import { useState, useEffect } from "react"
import { ShieldCheck, ShieldAlert, AlertTriangle, Terminal, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface DiagnosticLog {
  level: "info" | "warn" | "error"
  category: "BOOT" | "SECURITY" | "CONTROLS" | "MOBILE" | "PERFORMANCE"
  message: string
  timestamp: string
}

interface PlaytestReportData {
  id: string
  status: "PASSED" | "WARNINGS" | "FAILED"
  score: number
  bootSuccess: boolean
  hasJsErrors: boolean
  mobileCompatible: boolean
  controlsVerified: boolean
  logs: DiagnosticLog[]
  testedAt: string
}

interface PlaytestReportBadgeProps {
  gameId: string
  userRole?: string | null
}

export function PlaytestReportBadge({ gameId, userRole }: PlaytestReportBadgeProps) {
  const [report, setReport] = useState<PlaytestReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [retesting, setRetesting] = useState(false)
  const [open, setOpen] = useState(false)

  const fetchReport = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/playtest?gameId=${gameId}`)
      if (res.ok) {
        const data = await res.json()
        setReport(data.report)
      }
    } catch {
      // Fail gracefully
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchReport()
  }, [gameId])

  const handleRetest = async () => {
    try {
      setRetesting(true)
      const res = await fetch("/api/playtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      })
      if (res.ok) {
        const data = await res.json()
        setReport(data.report)
      }
    } catch {
      // Fail gracefully
    } finally {
      setRetesting(false)
    }
  }

  if (loading) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#11111d] border border-[#2e3446] text-[10px] text-[#8b93a6] font-arcade animate-pulse">
        <span>AGENTIC QA SCANNING...</span>
      </div>
    )
  }

  if (!report) return null

  const isPassed = report.status === "PASSED"
  const isWarnings = report.status === "WARNINGS"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-arcade transition-all border ${
            isPassed
              ? "bg-[#00ff66]/10 border-[#00ff66]/40 text-[#00ff66] hover:bg-[#00ff66]/20"
              : isWarnings
                ? "bg-[#ffff00]/10 border-[#ffff00]/40 text-[#ffff00] hover:bg-[#ffff00]/20"
                : "bg-[#ff0040]/10 border-[#ff0040]/40 text-[#ff0040] hover:bg-[#ff0040]/20"
          }`}
        >
          {isPassed ? (
            <ShieldCheck className="w-3.5 h-3.5" />
          ) : isWarnings ? (
            <AlertTriangle className="w-3.5 h-3.5" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5" />
          )}
          <span>QA SCORE: {report.score}/100</span>
          <span className="opacity-70">({report.status})</span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-lg bg-[#0d0d15] border-2 border-[#4a4a6a] text-white p-5">
        <DialogHeader>
          <DialogTitle className="font-pixel text-sm text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#ffff00]" />
            Agentic Playtest Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Overview Score Grid */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-[#11111d] border border-[#2e3446] rounded">
            <div>
              <span className="font-arcade text-[10px] text-[#8b93a6] block">QUALITY SCORE</span>
              <span className={`font-pixel text-lg ${isPassed ? "text-[#00ff66]" : isWarnings ? "text-[#ffff00]" : "text-[#ff0040]"}`}>
                {report.score}/100
              </span>
            </div>
            <div>
              <span className="font-arcade text-[10px] text-[#8b93a6] block">VERDICT</span>
              <span className="font-pixel text-sm text-white">{report.status}</span>
            </div>
          </div>

          {/* Test Checks Checklist */}
          <div className="space-y-2 text-xs font-arcade bg-[#1a1a2e] p-3 rounded border border-[#2e3446]">
            <div className="flex justify-between items-center">
              <span>Cartridge Boot Load:</span>
              <span className={report.bootSuccess ? "text-[#00ff66]" : "text-[#ff0040]"}>
                {report.bootSuccess ? "PASSED" : "FAILED"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>JS Error Scan:</span>
              <span className={!report.hasJsErrors ? "text-[#00ff66]" : "text-[#ff0040]"}>
                {!report.hasJsErrors ? "CLEAN" : "ERRORS DETECTED"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Mobile Viewport Fit:</span>
              <span className={report.mobileCompatible ? "text-[#00ff66]" : "text-[#ffff00]"}>
                {report.mobileCompatible ? "VERIFIED" : "NO META VIEWPORT"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Controls & Input Listeners:</span>
              <span className={report.controlsVerified ? "text-[#00ff66]" : "text-[#ffff00]"}>
                {report.controlsVerified ? "VERIFIED" : "UNCONFIRMED"}
              </span>
            </div>
          </div>

          {/* Diagnostic Log Console */}
          <div className="space-y-1">
            <span className="font-arcade text-[10px] text-[#8b93a6] block">DIAGNOSTIC TELEMETRY LOGS</span>
            <div className="h-40 overflow-y-auto bg-black p-2.5 rounded font-mono text-[11px] space-y-1.5 border border-[#2e3446]">
              {report.logs?.map((log, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-[#4a4a6a] shrink-0">[{log.category}]</span>
                  <span className={log.level === "error" ? "text-[#ff0040]" : log.level === "warn" ? "text-[#ffff00]" : "text-[#8b93a6]"}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Retest Trigger */}
          <div className="flex justify-between items-center pt-2">
            <span className="font-arcade text-[10px] text-[#8b93a6]">
              Scanned {new Date(report.testedAt).toLocaleDateString()}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={retesting}
              onClick={() => void handleRetest()}
              className="gap-1.5 text-xs font-arcade"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${retesting ? "animate-spin" : ""}`} />
              RE-RUN QA AGENT
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
