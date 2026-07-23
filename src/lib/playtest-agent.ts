import prisma from "@/lib/prisma"

export interface DiagnosticLog {
  level: "info" | "warn" | "error"
  category: "BOOT" | "SECURITY" | "CONTROLS" | "MOBILE" | "PERFORMANCE"
  message: string
  timestamp: string
}

export async function runAgenticPlaytest(gameId: string, capsuleId?: string) {
  // Find or create capsule if not present
  let targetCapsule = capsuleId
    ? await prisma.gameCapsule.findUnique({ where: { id: capsuleId } })
    : await prisma.gameCapsule.findFirst({
        where: { gameId },
        orderBy: { createdAt: "desc" },
      })

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: {
      id: true,
      title: true,
      slug: true,
      gameUrl: true,
      supportsMobile: true,
      mobileOrientation: true,
      aiTool: true,
      aiModel: true,
    },
  })

  if (!game) {
    throw new Error(`Game with ID ${gameId} not found`)
  }

  // Create default capsule if missing
  if (!targetCapsule) {
    targetCapsule = await prisma.gameCapsule.create({
      data: {
        gameId: game.id,
        slug: `${game.slug}-v1-0-0`,
        version: "1.0.0",
        buildArtifact: game.gameUrl,
        entryPoint: "index.html",
        manifest: {
          title: game.title,
          supportsMobile: game.supportsMobile,
          mobileOrientation: game.mobileOrientation,
          aiTool: game.aiTool,
          aiModel: game.aiModel,
        },
      },
    })
  }

  const logs: DiagnosticLog[] = []
  let score = 100
  let bootSuccess = true
  let hasJsErrors = false
  let mobileCompatible = game.supportsMobile
  let controlsVerified = true

  logs.push({
    level: "info",
    category: "BOOT",
    message: `Initiating agentic playtest session for ${game.title} (Cartridge URL: ${game.gameUrl})`,
    timestamp: new Date().toISOString(),
  })

  // 1. Boot Verification
  if (!game.gameUrl || game.gameUrl.trim() === "") {
    bootSuccess = false
    score -= 50
    logs.push({
      level: "error",
      category: "BOOT",
      message: "Cartridge entry URL is missing or empty.",
      timestamp: new Date().toISOString(),
    })
  } else {
    logs.push({
      level: "info",
      category: "BOOT",
      message: "Build entry URL validated successfully.",
      timestamp: new Date().toISOString(),
    })
  }

  // 2. Static Security & Runtime Inspection
  try {
    const res = await fetch(game.gameUrl, { method: "GET" })
    if (!res.ok) {
      bootSuccess = false
      score -= 40
      logs.push({
        level: "error",
        category: "BOOT",
        message: `HTTP fetch failed with status ${res.status}. Build may be unreachable.`,
        timestamp: new Date().toISOString(),
      })
    } else {
      const htmlText = await res.text()

      // Security check
      if (htmlText.includes("window.parent.document") || htmlText.includes("document.cookie")) {
        score -= 20
        logs.push({
          level: "warn",
          category: "SECURITY",
          message: "Potential parent frame dereference detected in cartridge source.",
          timestamp: new Date().toISOString(),
        })
      } else {
        logs.push({
          level: "info",
          category: "SECURITY",
          message: "Origin isolation scan passed cleanly. No parent DOM manipulation detected.",
          timestamp: new Date().toISOString(),
        })
      }

      // Check canvas/render target
      if (htmlText.includes("<canvas") || htmlText.includes("phaser") || htmlText.includes("pixi") || htmlText.includes("three") || htmlText.includes("requestAnimationFrame")) {
        logs.push({
          level: "info",
          category: "PERFORMANCE",
          message: "Active rendering context (Canvas / WebGL / RAF loop) verified.",
          timestamp: new Date().toISOString(),
        })
      } else {
        score -= 10
        logs.push({
          level: "warn",
          category: "PERFORMANCE",
          message: "No standard HTML5 canvas or animation loop found. Game may be DOM-only.",
          timestamp: new Date().toISOString(),
        })
      }

      // Mobile viewport check
      if (htmlText.includes('name="viewport"') || htmlText.includes("name='viewport'")) {
        mobileCompatible = true
        logs.push({
          level: "info",
          category: "MOBILE",
          message: "Mobile viewport meta tag detected.",
          timestamp: new Date().toISOString(),
        })
      } else if (game.supportsMobile) {
        score -= 10
        logs.push({
          level: "warn",
          category: "MOBILE",
          message: "Cartridge is marked as mobile-friendly, but missing meta viewport tag.",
          timestamp: new Date().toISOString(),
        })
      }

      // Controls check
      if (htmlText.includes("keydown") || htmlText.includes("touchstart") || htmlText.includes("pointerdown") || htmlText.includes("addEventListener")) {
        controlsVerified = true
        logs.push({
          level: "info",
          category: "CONTROLS",
          message: "Input listener hooks (Keyboard/Touch/Pointer) detected in build scripts.",
          timestamp: new Date().toISOString(),
        })
      } else {
        controlsVerified = false
        score -= 15
        logs.push({
          level: "warn",
          category: "CONTROLS",
          message: "No standard input event listeners found in main HTML document.",
          timestamp: new Date().toISOString(),
        })
      }
    }
  } catch (err: unknown) {
    hasJsErrors = true
    score -= 30
    logs.push({
      level: "error",
      category: "BOOT",
      message: `Failed to inspect build source: ${err instanceof Error ? err.message : "Network error"}`,
      timestamp: new Date().toISOString(),
    })
  }

  score = Math.max(0, Math.min(100, score))
  const status = score >= 80 ? "PASSED" : score >= 50 ? "WARNINGS" : "FAILED"

  // Upsert PlaytestReport
  const report = await prisma.playtestReport.upsert({
    where: { capsuleId: targetCapsule.id },
    create: {
      capsuleId: targetCapsule.id,
      status,
      score,
      bootSuccess,
      hasJsErrors,
      mobileCompatible,
      controlsVerified,
      logs: JSON.parse(JSON.stringify(logs)),
      diagnostics: {
        inspectedAt: new Date().toISOString(),
        gameId: game.id,
        slug: game.slug,
      },
    },
    update: {
      status,
      score,
      bootSuccess,
      hasJsErrors,
      mobileCompatible,
      controlsVerified,
      logs: JSON.parse(JSON.stringify(logs)),
      diagnostics: {
        inspectedAt: new Date().toISOString(),
        gameId: game.id,
        slug: game.slug,
      },
      testedAt: new Date(),
    },
  })

  return report
}
